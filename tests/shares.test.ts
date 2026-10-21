import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type IncomingMessage } from "node:http";
import { mkdtemp, readFile } from "node:fs/promises";
import { connect, type AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkLnet, cleanName } from "../shares/checks.ts";
import {
  HttpError,
  clientIp,
  createLimiter,
  limitKey,
} from "../shares/http.ts";
import { openStore, saveShare, storedBytes, sweep } from "../shares/store.ts";
import { createShareApi, readConfig, type Config } from "../shares/api.ts";

const sample = "version=1.0\nnetwork=Bees\nlabel=Hive\n";

test("share text must look like an .lnet export and fit 512 KB", () => {
  assert.equal(checkLnet(sample), Buffer.byteLength(sample));
  const full = sample + "a".repeat(524_288 - sample.length);
  assert.equal(checkLnet(full), 524_288);
  for (const good of [
    "\n\nversion=1.0\nnetwork=Bees\n",
    "format=lnet\nn=Bees\n",
    "lnet=1\r\nn=Bees\r\n",
  ])
    assert.equal(checkLnet(good), Buffer.byteLength(good));
  for (const bad of [
    42,
    null,
    "",
    "network=Bees\n",
    "hello\nversion=1.0\n",
    `${sample}\0`,
  ])
    assert.throws(() => checkLnet(bad), { message: "bad-share" });
  assert.throws(() => checkLnet(`${full}a`), { message: "too-large" });
  assert.throws(() => checkLnet(sample + "é".repeat(262_144)), {
    message: "too-large",
  });
});

test("share names keep only a clean file name", () => {
  assert.equal(cleanName("C:\\Users\\me\\base.lnet"), "base.lnet");
  assert.equal(cleanName("../../etc/passwd"), "passwd.lnet");
  assert.equal(cleanName(" my\u0007base\u007f.LNET "), "mybase.lnet");
  assert.equal(cleanName("   "), "network.lnet");
  assert.equal(cleanName(".lnet"), "network.lnet");
  const long = cleanName("a".repeat(300));
  assert.equal(long.length, 100);
  assert.ok(long.endsWith(".lnet"));
  assert.equal(cleanName("invoice_\u202Efdp\u200B.lnet"), "invoice_fdp.lnet");
  const emoji = cleanName(`${"a".repeat(94)}😀😀`);
  assert.equal(emoji, `${"a".repeat(94)}😀.lnet`);
  assert.throws(() => cleanName(7), { message: "bad-share" });
});

test("limit keys group IPv6 addresses by /64", () => {
  assert.equal(limitKey("203.0.113.9"), "203.0.113.9");
  assert.equal(limitKey("::ffff:203.0.113.9"), "203.0.113.9");
  assert.equal(limitKey("2001:db8:1:2:3:4:5:6"), "2001:db8:1:2::/64");
  assert.equal(limitKey("2001:0db8:0001:0002::5"), "2001:db8:1:2::/64");
  assert.equal(limitKey("2001:db8::1"), "2001:db8:0:0::/64");
  assert.equal(limitKey("::1"), "0:0:0:0::/64");
  assert.equal(limitKey("unknown"), "unknown");
});

test("rate limiter allows the window then refuses until reset", () => {
  const limiter = createLimiter(true);
  limiter.hit("key", 2, 1000, 0);
  limiter.hit("key", 2, 1000, 10);
  assert.throws(
    () => limiter.hit("key", 2, 1000, 20),
    (error: HttpError) => error.status === 429,
  );
  limiter.hit("key", 2, 1000, 1000);
  const off = createLimiter(false);
  off.hit("key", 0, 1000);
  off.hit("key", 0, 1000);
});

test("store counts live bytes and sweeps expired shares", async () => {
  const path = join(await mkdtemp(join(tmpdir(), "lnet-shares-")), "s.db");
  openStore(path).close();
  const db = openStore(path);
  const row = { name: "a.lnet", lnet: sample, size: 10 };
  saveShare(db, { ...row, id: "expired0000", expiresAt: 10 });
  saveShare(db, { ...row, id: "live0000000", expiresAt: 20 });
  assert.equal(storedBytes(db, 0), 20);
  assert.equal(storedBytes(db, 10), 10);
  sweep(db, 10);
  const ids = db.prepare("SELECT id FROM shares").all() as { id: string }[];
  assert.deepEqual(
    ids.map((share) => share.id),
    ["live0000000"],
  );
  db.close();
});

const origin = "http://localhost:8794";
const lnet = await readFile("library/bee-automation.lnet", "utf8");

async function startApi(overrides: Partial<Config> = {}) {
  const dir = await mkdtemp(join(tmpdir(), "lnet-shares-api-"));
  const config: Config = {
    ...readConfig({}),
    origin,
    dbPath: join(dir, "shares.db"),
    rateLimits: false,
    ...overrides,
  };
  const server = createServer(createShareApi(config)).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const db = openStore(config.dbPath);
  const call = async (
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return {
      status: response.status,
      headers: response.headers,
      body: text ? JSON.parse(text) : undefined,
    };
  };
  const close = () => {
    server.closeAllConnections();
    server.close();
    db.close();
  };
  return { call, db, close, base };
}

test("share quota is read in megabytes", () => {
  assert.equal(readConfig({}).quota, 256 * 1_048_576);
  assert.equal(readConfig({ SHARE_QUOTA_MB: "2" }).quota, 2_097_152);
});

test("a share is created, read back and gone after expiry", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const before = Date.now();
  const created = await api.call("POST", "/api/shares", {
    name: "C:\\saves\\bees.lnet",
    lnet,
  });
  assert.equal(created.status, 201);
  assert.match(created.body.id, /^[A-Za-z0-9_-]{11}$/);
  assert.ok(created.body.expiresAt >= before + 43_200_000);
  const path = `/api/shares?id=${created.body.id}`;
  const read = await api.call("GET", path);
  assert.deepEqual(read.body, {
    name: "bees.lnet",
    lnet,
    expiresAt: created.body.expiresAt,
  });
  assert.equal(read.headers.get("cache-control"), "no-store");
  api.db.prepare("UPDATE shares SET expires_at = 0").run();
  const gone = await api.call("GET", path);
  assert.equal(gone.status, 404);
  assert.equal(gone.body.error, "share-gone");
  assert.equal((await api.call("GET", "/api/shares?id=../../x")).status, 404);
  assert.equal((await api.call("GET", "/api/shares")).status, 404);
  assert.equal(
    (await api.call("DELETE", "/api/shares")).body.error,
    "not-found",
  );
});

test("share uploads are checked before anything is stored", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const post = (body: object, headers?: Record<string, string>) =>
    api.call("POST", "/api/shares", body, headers);
  const good = { name: "a.lnet", lnet };
  assert.equal(
    (await post(good, { Origin: "https://evil.example" })).status,
    403,
  );
  assert.equal(
    (await post(good, { "Content-Type": "text/plain" })).status,
    415,
  );
  assert.equal(
    (await post({ ...good, lnet: "not a network" })).body.error,
    "bad-share",
  );
  assert.equal((await post({ ...good, name: 7 })).body.error, "bad-share");
  const big = await post({ ...good, lnet: `${lnet}\n${"x".repeat(600_000)}` });
  assert.equal(big.status, 413);
  assert.equal(big.body.error, "too-large");
  const count = api.db.prepare("SELECT count(*) AS n FROM shares").get() as {
    n: number;
  };
  assert.equal(count.n, 0);
});

test("creating shares is rate limited per address", async (t) => {
  const api = await startApi({ rateLimits: true });
  t.after(api.close);
  const post = () => api.call("POST", "/api/shares", { name: "a.lnet", lnet });
  for (let index = 0; index < 10; index++)
    assert.equal((await post()).status, 201);
  const refused = await post();
  assert.equal(refused.status, 429);
  assert.equal(refused.body.error, "rate-limited");
});

test("sharing pauses while live shares fill the quota", async (t) => {
  const api = await startApi({ quota: Buffer.byteLength(lnet) * 2 });
  t.after(api.close);
  const post = () => api.call("POST", "/api/shares", { name: "a.lnet", lnet });
  assert.equal((await post()).status, 201);
  assert.equal((await post()).status, 201);
  const full = await post();
  assert.equal(full.status, 503);
  assert.equal(full.body.error, "shares-full");
  api.db.prepare("UPDATE shares SET expires_at = 0").run();
  assert.equal((await post()).status, 201);
});

test("odd request targets get a 404 instead of a crash", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const raw = await new Promise<string>((resolve, reject) => {
    const socket = connect(Number(new URL(api.base).port), "127.0.0.1", () =>
      socket.end("GET //a:99999/../api/shares HTTP/1.1\r\nHost: x\r\n\r\n"),
    );
    let text = "";
    socket.on("data", (chunk) => (text += chunk));
    socket.on("end", () => resolve(text));
    socket.on("error", reject);
  });
  assert.match(raw, /^HTTP\/1\.1 404/);
  assert.equal((await api.call("GET", "/api/shares")).status, 404);
});

test("client IP uses the last forwarded entry only behind the proxy", () => {
  const request = {
    headers: { "x-forwarded-for": "203.0.113.9, 198.51.100.7" },
    socket: { remoteAddress: "127.0.0.1" },
  } as unknown as IncomingMessage;
  assert.equal(clientIp(request, true), "198.51.100.7");
  assert.equal(clientIp(request, false), "127.0.0.1");
});
