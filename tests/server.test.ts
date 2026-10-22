import { test } from "node:test";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../server/db.ts";
import { HttpError, createLimiter } from "../server/http.ts";
import {
  consume,
  endOtherSessions,
  issue,
  peek,
  readSession,
  rewrite,
  sessionLife,
  startSession,
  sweep,
  touchAuthed,
} from "../server/tokens.ts";
import { checkEmail, checkUsername, createUser } from "../server/users.ts";
import { readConfig } from "../server/config.ts";
import {
  checkPassword,
  hashPassword,
  needsRehash,
  passwordMatches,
  verifyPassword,
} from "../server/passwords.ts";

test("usernames and emails follow the shared rules", () => {
  assert.equal(checkUsername(" Builder_1 "), "Builder_1");
  for (const bad of ["ab", "a".repeat(25), "has space", "émile", 42])
    assert.throws(() => checkUsername(bad), { message: "bad-username" });
  assert.throws(() => checkUsername("Admin"), { message: "username-taken" });
  assert.equal(checkEmail(" Player@Example.COM "), "player@example.com");
  assert.equal(
    checkEmail("first.last+tag@sub.example.co.uk"),
    "first.last+tag@sub.example.co.uk",
  );
  for (const bad of [
    "",
    "player",
    "a@b",
    "a b@c.d",
    `${"a".repeat(250)}@b.co`,
    null,
    "x<victim@gmail.com>.co",
    "a@evil.co;b.co",
    "a@evil.co,victim",
    "a\\b@c.co",
  ])
    assert.throws(() => checkEmail(bad), { message: "bad-email" });
});

test("rate limiter allows the window then refuses until reset", () => {
  const limiter = createLimiter(true);
  limiter.hit("key", 2, 1000, 0);
  limiter.hit("key", 2, 1000, 10);
  assert.throws(
    () => limiter.hit("key", 2, 1000, 20),
    (error: HttpError) => error.status === 429 && error.retryAfter === 1,
  );
  limiter.hit("key", 2, 1000, 1000);
  createLimiter(false).hit("key", 0, 1000);
});

test("migrations run once per database file", async () => {
  const path = join(await mkdtemp(join(tmpdir(), "lnet-db-")), "app.db");
  openDb(path).close();
  const db = openDb(path);
  const row = db.prepare("PRAGMA user_version").get() as {
    user_version: number;
  };
  assert.equal(row.user_version, 3);
  db.close();
});

test("tokens are single-use, purpose-bound, rewritable and expire", () => {
  const db = openDb(":memory:");
  const token = issue(db, "reset", { userId: 1 }, 0);
  assert.equal(consume(db, "signup", token, 1), null);
  rewrite(db, "reset", token, { userId: 2 });
  assert.deepEqual(peek(db, "reset", token, 1), { userId: 2 });
  assert.deepEqual(consume(db, "reset", token, 1), { userId: 2 });
  assert.equal(consume(db, "reset", token, 1), null);
  assert.equal(
    consume(db, "reset", issue(db, "reset", {}, 0), 1_800_000),
    null,
  );
  assert.equal(consume(db, "reset", 42, 0), null);
});

test("sessions slide, remember sign-in time and end other devices", () => {
  const db = openDb(":memory:");
  db.prepare(
    "INSERT INTO users (username, email, webauthn_id, created_at) VALUES ('a_user', 'a@b.co', x'00', 0)",
  ).run();
  const token = startSession(db, 1, 0);
  const first = readSession(db, token, 1)!;
  assert.equal(first.userId, 1);
  assert.equal(first.authedAt, 0);
  assert.equal(first.renewed, false);
  assert.equal(readSession(db, token, sessionLife * 0.6)!.renewed, true);
  assert.equal(readSession(db, token, sessionLife * 0.7)!.renewed, false);
  touchAuthed(db, first.hash, 500);
  assert.equal(readSession(db, token, 600)!.authedAt, 500);
  const other = startSession(db, 1, 0);
  endOtherSessions(db, 1, first.hash);
  assert.equal(readSession(db, other, 1), null);
  assert.equal(readSession(db, startSession(db, 1, 0), sessionLife), null);
  sweep(db, sessionLife);
  const left = db.prepare("SELECT count(*) AS n FROM sessions").get() as {
    n: number;
  };
  assert.equal(left.n, 1);
});

test("duplicate usernames and emails map to 409 codes", () => {
  const db = openDb(":memory:");
  createUser(db, "Alice", "a@b.co", null);
  assert.throws(() => createUser(db, "alice", "c@d.co", null), {
    message: "username-taken",
  });
  assert.throws(() => createUser(db, "Bob", "A@B.CO", null), {
    message: "email-taken",
  });
});

const config = readConfig({});
const respond = (body: string) =>
  (async () => new Response(body)) as unknown as typeof fetch;
const sha1 = (text: string) =>
  createHash("sha1").update(text).digest("hex").toUpperCase();

test("passwords need 12 to 128 code points, no username and no breach", async () => {
  const rules = { ...config, fetch: respond("") };
  for (const bad of ["short", "x".repeat(129), 42])
    await assert.rejects(checkPassword(rules, bad, "builder"), {
      message: "password-length",
    });
  await assert.rejects(checkPassword(rules, "my Builder password", "builder"), {
    message: "password-username",
  });
  assert.equal(
    await checkPassword(rules, "🙂".repeat(12), "builder"),
    "🙂".repeat(12),
  );
  const pwned = "correct horse battery staple";
  const listed = respond(`${sha1(pwned).slice(5)}:3\r\nABCDEF:0\r\n`);
  await assert.rejects(
    checkPassword({ ...config, fetch: listed }, pwned, "builder"),
    {
      message: "password-breached",
    },
  );
  const down = (async () => {
    throw new Error("offline");
  }) as unknown as typeof fetch;
  assert.equal(
    await checkPassword({ ...config, fetch: down }, pwned, "builder"),
    pwned,
  );
});

test("breach check sends only a 5-character hash prefix with padding", async () => {
  const pwned = "correct horse battery staple";
  const seen: { url: string; padding: string | null }[] = [];
  const recording = (async (url: string, init: RequestInit) => {
    seen.push({ url, padding: new Headers(init.headers).get("Add-Padding") });
    return new Response("");
  }) as unknown as typeof fetch;
  await checkPassword({ ...config, fetch: recording }, pwned, "builder");
  assert.equal(seen.length, 1);
  assert.equal(
    seen[0].url,
    `https://api.pwnedpasswords.com/range/${sha1(pwned).slice(0, 5)}`,
  );
  assert.equal(seen[0].padding, "true");
});

test("argon2id hashes verify, normalise and flag old parameters", async () => {
  const { pepper } = config;
  const hash = await hashPassword("ﬁle cabinet key", pepper);
  assert.match(
    hash,
    /^\$argon2id\$v=19\$m=65536,t=3,p=4\$[A-Za-z0-9+/]{22}\$[A-Za-z0-9+/]{43}$/,
  );
  assert.equal(await verifyPassword(hash, "file cabinet key", pepper), true);
  assert.equal(await verifyPassword(hash, "file cabinet kez", pepper), false);
  assert.equal(
    await verifyPassword(hash, "file cabinet key", Buffer.alloc(32, 1)),
    false,
  );
  assert.equal(needsRehash(hash), false);
  const old = await hashPassword("file cabinet key", pepper, {
    memory: 19_456,
    passes: 2,
    parallelism: 1,
  });
  assert.equal(needsRehash(old), true);
  assert.equal(await verifyPassword(old, "file cabinet key", pepper), true);
  assert.equal(await passwordMatches(null, "file cabinet key", pepper), false);
  assert.equal(await passwordMatches(hash, "file cabinet key", pepper), true);
  assert.equal(await passwordMatches(hash, "file cabinet kez", pepper), false);
});
