import { test } from "node:test";
import assert from "node:assert/strict";
import { request } from "node:http";
import { confirm, password, signUp, startApi, tokenIn } from "./api-client.ts";

const fresh = "a brand new gravel path";

const raw = (base: string, path: string) =>
  new Promise<number>((resolve, reject) => {
    const { hostname, port } = new URL(base);
    request({ hostname, port, path, method: "GET" }, (response) => {
      response.resume();
      resolve(response.statusCode!);
    })
      .on("error", reject)
      .end();
  });

test("malformed request paths get 404 and the server stays up", async (t) => {
  const api = await startApi();
  t.after(api.close);
  for (const path of ["//", "//api%2Fme", "//api:99999/x"])
    assert.equal(await raw(api.base, path), 404);
  assert.equal((await api.client().call("GET", "/api/me")).status, 200);
});

test("accounts without a password cannot sign in with one", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const client = api.client();
  await signUp(api, client, "Keyed", "keyed@example.com");
  api.sql("UPDATE users SET password_hash = NULL");
  const login = await client.call("POST", "/api/login", {
    login: "Keyed",
    password,
  });
  assert.deepEqual(login.body, { error: "invalid-login" });
});

test("a finished reset kills every other reset link", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const client = api.client();
  await signUp(api, client, "Twice", "twice@example.com");
  await client.call("POST", "/api/signup", {
    username: "Other_1",
    email: "twice@example.com",
    password,
  });
  const fromSignup = tokenIn(
    (await api.mail("twice@example.com")).text,
    "reset",
  );
  await client.call("POST", "/api/reset", { email: "twice@example.com" });
  const fromReset = tokenIn(
    (await api.mail("twice@example.com")).text,
    "reset",
  );
  const complete = (token: string) =>
    client.call("POST", "/api/reset/complete", { token, password: fresh });
  assert.equal((await complete(fromSignup)).status, 204);
  assert.equal((await complete(fromReset)).body.error, "link-expired");
});

test("two pending signups for one username: the second gets 409", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const client = api.client();
  for (const email of ["one@example.com", "two@example.com"])
    await client.call("POST", "/api/signup", {
      username: "Shared",
      email,
      password,
    });
  const mailOne = await api.mail("one@example.com");
  assert.match(mailOne.text, /"Shared"/);
  const first = tokenIn(mailOne.text, "signup");
  const second = tokenIn((await api.mail("two@example.com")).text, "signup");
  assert.equal(
    (
      await client.call("POST", "/api/signup/verify", {
        token: first,
        password,
      })
    ).status,
    200,
  );
  const late = await client.call("POST", "/api/signup/verify", {
    token: second,
    password,
  });
  assert.equal(late.body.error, "username-taken");
});

test("a signup link only works with the password chosen at signup", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const client = api.client();
  await client.call("POST", "/api/signup", {
    username: "Proof",
    email: "proof@example.com",
    password,
  });
  const token = tokenIn((await api.mail("proof@example.com")).text, "signup");
  const confirmWith = (guess: unknown) =>
    client.call("POST", "/api/signup/verify", { token, password: guess });
  for (const guess of ["wrong password here", "", 42])
    assert.equal((await confirmWith(guess)).body.error, "signup-password");
  assert.equal((await client.call("GET", "/api/me")).body, null);
  assert.equal((await confirmWith(password)).body.user.username, "Proof");
});

test("a signup link allows five password tries", async (t) => {
  const api = await startApi({ rateLimits: true });
  t.after(api.close);
  const client = api.client();
  await client.call("POST", "/api/signup", {
    username: "Guess",
    email: "guess@example.com",
    password,
  });
  const token = tokenIn((await api.mail("guess@example.com")).text, "signup");
  const confirmWith = (guess: string) =>
    client.call("POST", "/api/signup/verify", { token, password: guess });
  for (let attempt = 0; attempt < 5; attempt++)
    assert.equal((await confirmWith("wrong password here")).status, 401);
  assert.equal((await confirmWith(password)).status, 429);
});

test("password signup is confirmed by email, then signs out and back in", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const client = api.client();
  const signup = await client.call("POST", "/api/signup", {
    username: "Builder_1",
    email: "Builder@Example.com",
    password,
  });
  assert.equal(signup.status, 202);
  const token = tokenIn((await api.mail("builder@example.com")).text, "signup");
  assert.equal((await client.call("GET", "/api/me")).body, null);
  const verify = await confirm(client, token);
  assert.equal(verify.body.user.username, "Builder_1");
  const again = await confirm(client, token);
  assert.equal(again.body.error, "link-expired");
  const me = await client.call("GET", "/api/me");
  assert.equal(me.body.user.email, "builder@example.com");
  assert.equal(me.body.hasPassword, true);
  assert.equal((await client.call("POST", "/api/logout")).status, 204);
  assert.equal((await client.call("GET", "/api/me")).body, null);
  const byName = await client.call("POST", "/api/login", {
    login: "builder_1",
    password,
  });
  assert.equal(byName.status, 200);
  const byEmail = await client.call("POST", "/api/login", {
    login: "BUILDER@example.com",
    password,
  });
  assert.equal(byEmail.body.user.username, "Builder_1");
});
