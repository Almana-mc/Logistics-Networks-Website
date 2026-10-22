import { test } from "node:test";
import assert from "node:assert/strict";
import {
  confirm,
  password,
  signUp,
  startApi,
  startAdmin,
  tokenIn,
} from "./api-client.ts";

test("blocks match an address or a whole domain", async (t) => {
  const { api, admin, user } = await startAdmin(t);
  const spammer = api.client();
  await signUp(api, spammer, "Spammer", "spam@spam.test");
  const block = (pattern: string) =>
    admin.call("POST", "/api/admin/blocks", { pattern });
  for (const pattern of ["", "nope", "@", "@localhost", "a@@b.com"])
    assert.equal((await block(pattern)).body.error, "bad-pattern");
  assert.equal((await block("Boss@Example.com")).body.error, "admin-target");
  assert.equal((await block("@EXAMPLE.com")).body.error, "admin-target");
  const added = await block(" @SPAM.test ");
  assert.equal(added.status, 201);
  assert.deepEqual(
    added.body.map((row: { pattern: string; accounts: number }) => [
      row.pattern,
      row.accounts,
    ]),
    [["@spam.test", 1]],
  );
  assert.match((await api.mail("spam@spam.test")).subject, /suspended/);
  assert.equal((await spammer.call("GET", "/api/me")).body, null);
  const guest = api.client();
  const login = () =>
    guest.call("POST", "/api/login", { login: "Spammer", password });
  assert.equal((await login()).body.error, "account-suspended");
  const signup = (email: string) =>
    guest.call("POST", "/api/signup", { username: "Another", email, password });
  assert.equal((await signup("new@spam.test")).body.error, "email-blocked");
  assert.equal((await signup("new@mail.spam.test")).status, 202);
  await api.mail("new@mail.spam.test");
  assert.equal(
    (await user.call("GET", "/api/me")).body.user.username,
    "Member",
  );
  const removed = await admin.call("DELETE", "/api/admin/blocks", {
    pattern: "@spam.test",
  });
  assert.deepEqual(removed.body, []);
  assert.equal((await spammer.call("GET", "/api/me")).body, null);
  assert.match((await api.mail("spam@spam.test")).subject, /active again/);
  assert.equal((await login()).status, 200);
  assert.equal(
    (await admin.call("DELETE", "/api/admin/blocks", { pattern: "@spam.test" }))
      .status,
    404,
  );
  assert.deepEqual(
    (await admin.call("GET", "/api/admin/log")).body.map(
      (entry: { action: string }) => entry.action,
    ),
    ["block.remove", "block.add"],
  );
});

test("an exact block stops a pending signup and an existing account", async (t) => {
  const { api, admin, user } = await startAdmin(t);
  const guest = api.client();
  await guest.call("POST", "/api/signup", {
    username: "Late",
    email: "late@example.org",
    password,
  });
  const token = tokenIn((await api.mail("late@example.org")).text, "signup");
  await admin.call("POST", "/api/admin/blocks", {
    pattern: "late@example.org",
  });
  assert.equal((await confirm(guest, token)).body.error, "email-blocked");
  await admin.call("POST", "/api/admin/blocks", {
    pattern: "member@example.com",
  });
  assert.equal((await user.call("GET", "/api/me")).body, null);
  const listed = (await admin.call("GET", "/api/admin/blocks")).body;
  assert.equal(listed.length, 2);
  api.sql("UPDATE users SET suspended_at = 1 WHERE id = 2");
  await admin.call("DELETE", "/api/admin/blocks", {
    pattern: "member@example.com",
  });
  await api.mail("member@example.com");
  await assert.rejects(api.mail("member@example.com"));
});

test("a block never covers an admin, even a locked-out one", async (t) => {
  const api = await startApi({ adminIds: [1, 2] });
  t.after(api.close);
  const boss = api.client();
  await signUp(api, boss, "Boss", "boss@example.com");
  await signUp(api, api.client(), "Deputy", "deputy@deputy.test");
  api.sql("UPDATE users SET suspended_at = 1 WHERE id = 2");
  const blocked = await boss.call("POST", "/api/admin/blocks", {
    pattern: "@deputy.test",
  });
  assert.equal(blocked.body.error, "admin-target");
});
