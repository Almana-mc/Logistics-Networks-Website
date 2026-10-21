import { test } from "node:test";
import assert from "node:assert/strict";
import { codeIn, password, signUp, startApi, tokenIn } from "./api-client.ts";
import { readConfig } from "../server/config.ts";
import { hashPassword, needsRehash } from "../server/passwords.ts";

const fresh = "a brand new gravel path";

test("signup checks input and never reveals registered emails", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const client = api.client();
  const attempt = (body: object) =>
    client.call("POST", "/api/signup", {
      username: "Fresh_1",
      email: "fresh@example.com",
      password,
      ...body,
    });
  assert.equal((await attempt({ username: "x" })).body.error, "bad-username");
  assert.equal((await attempt({ username: "Admin" })).status, 409);
  assert.equal((await attempt({ email: "nope" })).body.error, "bad-email");
  assert.equal(
    (await attempt({ password: "short" })).body.error,
    "password-length",
  );
  const named = await attempt({ password: "fresh_1 is my password" });
  assert.equal(named.body.error, "password-username");
  await signUp(api, client, "Taken", "taken@example.com");
  assert.equal(
    (await attempt({ username: "TAKEN" })).body.error,
    "username-taken",
  );
  assert.equal((await attempt({ email: "taken@example.com" })).status, 202);
  const mail = await api.mail("taken@example.com");
  assert.match(mail.subject, /already have/);
  assert.match(mail.text, /#reset=/);
  assert.doesNotMatch(mail.text, /#signup=/);
});

test("login errors are generic and old hashes are upgraded", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const client = api.client();
  await signUp(api, client, "Miner", "miner@example.com");
  for (const body of [
    { login: "nobody", password },
    { login: "Miner", password: "wrong password here" },
    {},
  ])
    assert.deepEqual((await client.call("POST", "/api/login", body)).body, {
      error: "invalid-login",
    });
  const weak = await hashPassword(password, readConfig({}).pepper, {
    memory: 19_456,
    passes: 2,
    parallelism: 1,
  });
  api.sql("UPDATE users SET password_hash = ?", weak);
  const login = await client.call("POST", "/api/login", {
    login: "Miner",
    password,
  });
  assert.equal(login.status, 200);
  assert.equal(
    needsRehash(api.row("SELECT password_hash FROM users").password_hash),
    false,
  );
});

test("password reset revokes every session and does not sign in", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const phone = api.client();
  await signUp(api, phone, "Lost_Phone", "lost@example.com");
  const laptop = api.client();
  const unknown = await laptop.call("POST", "/api/reset", {
    email: "nobody@example.com",
  });
  assert.equal(unknown.status, 202);
  const known = await laptop.call("POST", "/api/reset", {
    email: "LOST@example.com",
  });
  assert.equal(known.status, 202);
  const token = tokenIn((await api.mail("lost@example.com")).text, "reset");
  const complete = (next: string) =>
    laptop.call("POST", "/api/reset/complete", { token, password: next });
  assert.equal((await complete("short")).body.error, "password-length");
  assert.equal((await complete(fresh)).status, 204);
  assert.equal((await complete(fresh)).body.error, "link-expired");
  assert.equal((await phone.call("GET", "/api/me")).body, null);
  assert.equal((await laptop.call("GET", "/api/me")).body, null);
  assert.match(
    (await api.mail("lost@example.com")).subject,
    /password was reset/,
  );
  const old = await laptop.call("POST", "/api/login", {
    login: "Lost_Phone",
    password,
  });
  assert.equal(old.status, 401);
  const next = await laptop.call("POST", "/api/login", {
    login: "Lost_Phone",
    password: fresh,
  });
  assert.equal(next.status, 200);
  await assert.rejects(api.mail("nobody@example.com"));
});

test("password changes need a recent sign-in", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const client = api.client();
  const signedOut = await api
    .client()
    .call("PUT", "/api/me/password", { password });
  assert.equal(signedOut.status, 401);
  await signUp(api, client, "Smith", "smith@example.com");
  const other = api.client();
  await other.call("POST", "/api/login", { login: "Smith", password });
  assert.equal(
    (await client.call("PUT", "/api/me/password", { password: fresh })).status,
    204,
  );
  assert.equal((await other.call("GET", "/api/me")).body, null);
  assert.equal(
    (await client.call("GET", "/api/me")).body.user.username,
    "Smith",
  );
  assert.match(
    (await api.mail("smith@example.com")).subject,
    /password changed/,
  );
  api.sql("UPDATE sessions SET authed_at = 0");
  const change = () => client.call("PUT", "/api/me/password", { password });
  assert.equal((await change()).body.error, "reauth");
  const wrong = await client.call("POST", "/api/reauth/password", { password });
  assert.equal(wrong.body.error, "wrong-password");
  const right = await client.call("POST", "/api/reauth/password", {
    password: fresh,
  });
  assert.equal(right.status, 204);
  assert.equal((await change()).status, 204);
});

test("email codes allow five tries and stay bound to their session", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const client = api.client();
  await signUp(api, client, "Coder", "coder@example.com");
  api.sql("UPDATE sessions SET authed_at = 0");
  const first = (await client.call("POST", "/api/reauth/email")).body.token;
  const code = codeIn((await api.mail("coder@example.com")).text);
  const wrong = code === "000000" ? "111111" : "000000";
  const submit = (token: string, value: string) =>
    client.call("POST", "/api/reauth/code", { token, code: value });
  for (let attempt = 0; attempt < 5; attempt++)
    assert.equal((await submit(first, wrong)).body.error, "wrong-code");
  assert.equal((await submit(first, code)).body.error, "code-expired");
  const second = (await client.call("POST", "/api/reauth/email")).body.token;
  const next = codeIn((await api.mail("coder@example.com")).text);
  const stranger = api.client();
  await stranger.call("POST", "/api/login", { login: "Coder", password });
  const stolen = await stranger.call("POST", "/api/reauth/code", {
    token: second,
    code: next,
  });
  assert.equal(stolen.body.error, "code-expired");
  assert.equal((await submit(second, next)).status, 204);
  assert.equal(
    (await client.call("PUT", "/api/me/password", { password: fresh })).status,
    204,
  );
});

test("requests must be same-origin JSON under 16 KB", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const client = api.client();
  const body = { email: "a@b.co" };
  const evil = await client.call("POST", "/api/reset", body, {
    Origin: "https://evil.example",
  });
  assert.equal(evil.status, 403);
  const text = await client.call("POST", "/api/reset", body, {
    "Content-Type": "text/plain",
  });
  assert.equal(text.status, 415);
  const big = await client.call("POST", "/api/reset", {
    email: "x".repeat(17_000),
  });
  assert.equal(big.status, 413);
  assert.equal(
    (await client.call("POST", "/api/reset", { email: "nope" })).body.error,
    "bad-email",
  );
  assert.equal((await client.call("GET", "/api/nope")).status, 404);
  assert.equal(
    (await client.call("GET", "/api/me")).headers.get("cache-control"),
    "no-store",
  );
});

test("reset mail is rate limited per address", async (t) => {
  const api = await startApi({ rateLimits: true });
  t.after(api.close);
  const client = api.client();
  const reset = () =>
    client.call("POST", "/api/reset", { email: "spam@example.com" });
  for (let sent = 0; sent < 3; sent++)
    assert.equal((await reset()).status, 202);
  assert.equal((await reset()).status, 429);
});
