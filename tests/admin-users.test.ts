import { test } from "node:test";
import assert from "node:assert/strict";
import { password, sampleNetwork, startAdmin, tokenIn } from "./api-client.ts";
import { readConfig } from "../server/config.ts";

test("only listed ids are admins", async (t) => {
  assert.deepEqual(readConfig({ ADMIN_IDS: "2, 7,x,-1" }).adminIds, [2, 7]);
  assert.deepEqual(readConfig({}).adminIds, []);
  const { api, admin, user } = await startAdmin(t);
  assert.equal((await admin.call("GET", "/api/me")).body.admin, true);
  assert.equal((await user.call("GET", "/api/me")).body.admin, false);
  assert.equal((await api.client().call("GET", "/api/me")).body, null);
});

test("locked-out accounts lose sessions, sign-in, reset and networks", async (t) => {
  const { api, user } = await startAdmin(t);
  const { id } = (await user.call("POST", "/api/networks", sampleNetwork)).body;
  const guest = api.client();
  const login = (body: object) => guest.call("POST", "/api/login", body);
  await guest.call("POST", "/api/reset", { email: "member@example.com" });
  const token = tokenIn((await api.mail("member@example.com")).text, "reset");
  api.sql("UPDATE users SET suspended_at = 1 WHERE id = 2");
  assert.equal((await user.call("GET", "/api/me")).body, null);
  assert.equal(
    (await login({ login: "Member", password: "wrong password here" })).body
      .error,
    "invalid-login",
  );
  assert.equal(
    (await login({ login: "Member", password })).body.error,
    "account-suspended",
  );
  await guest.call("POST", "/api/reset", { email: "member@example.com" });
  await assert.rejects(api.mail("member@example.com"));
  const reset = await guest.call("POST", "/api/reset/complete", {
    token,
    password: "a brand new gravel path",
  });
  assert.equal(reset.body.error, "account-suspended");
  assert.deepEqual((await guest.call("GET", "/api/networks")).body, []);
  assert.equal(
    (await guest.call("GET", `/api/networks/file?id=${id}`)).status,
    404,
  );
  api.sql("UPDATE users SET suspended_at = NULL WHERE id = 2");
  assert.equal((await guest.call("GET", "/api/networks")).body.length, 1);
  assert.equal((await login({ login: "Member", password })).status, 200);
});

test("the audit log is admin-only and pages 100 entries", async (t) => {
  const { api, admin, user } = await startAdmin(t);
  assert.equal((await api.client().call("GET", "/api/admin/log")).status, 401);
  assert.equal(
    (await user.call("GET", "/api/admin/log")).body.error,
    "not-admin",
  );
  for (let index = 0; index < 120; index++)
    api.sql(
      "INSERT INTO admin_log (admin_id, action, target, detail, created_at) VALUES (1, 'test', 'user:2', '{\"n\":1}', 5)",
    );
  const first = (await admin.call("GET", "/api/admin/log")).body;
  assert.equal(first.length, 100);
  assert.deepEqual(first[0], {
    id: 120,
    admin: "Boss",
    action: "test",
    target: "user:2",
    detail: { n: 1 },
    createdAt: 5,
  });
  const rest = await admin.call("GET", `/api/admin/log?before=${first[99].id}`);
  assert.equal(rest.body.length, 20);
  assert.equal(rest.body[19].id, 1);
});

test("admins search users and see their networks", async (t) => {
  const { api, admin, user } = await startAdmin(t);
  await user.call("POST", "/api/networks", sampleNetwork);
  const found = (await admin.call("GET", "/api/admin/users?q=MEM")).body;
  assert.deepEqual(found, [
    {
      id: 2,
      username: "Member",
      email: "member@example.com",
      createdAt: found[0].createdAt,
      suspendedAt: null,
      networks: 1,
      locked: false,
      admin: false,
    },
  ]);
  assert.equal((await admin.call("GET", "/api/admin/users")).body.length, 2);
  const detail = (await admin.call("GET", "/api/admin/user?id=2")).body;
  assert.equal(detail.networkList[0].name, "Bee Automation");
  assert.equal((await admin.call("GET", "/api/admin/user?id=9")).status, 404);
  const byEmail = (await admin.call("GET", "/api/admin/users?q=@EXAMPLE")).body;
  assert.deepEqual(
    byEmail.map((row: { username: string; admin: boolean }) => [
      row.username,
      row.admin,
    ]),
    [
      ["Member", false],
      ["Boss", true],
    ],
  );
  api.sql("UPDATE users SET username = 'Admin' WHERE id = 2");
  const byName = (await admin.call("GET", "/api/admin/users?q=ADM")).body;
  assert.deepEqual(
    byName.map((row: { id: number }) => row.id),
    [2],
  );
});

test("admins rename users and move their email", async (t) => {
  const { api, admin } = await startAdmin(t);
  const edit = (body: object) =>
    admin.call("PUT", "/api/admin/user", { id: 2, ...body });
  assert.equal((await edit({ username: "x" })).body.error, "bad-username");
  assert.equal(
    (await edit({ username: "Admin" })).body.error,
    "username-taken",
  );
  assert.equal((await edit({ username: "boss" })).body.error, "username-taken");
  assert.equal(
    (await edit({ email: "BOSS@example.com" })).body.error,
    "email-taken",
  );
  await admin.call("POST", "/api/admin/blocks", { pattern: "@blocked.test" });
  assert.equal(
    (await edit({ email: "x@blocked.test" })).body.error,
    "email-blocked",
  );
  assert.equal(
    (await admin.call("PUT", "/api/admin/user", { id: 9, username: "Ghost" }))
      .status,
    404,
  );
  await api
    .client()
    .call("POST", "/api/reset", { email: "member@example.com" });
  const link = tokenIn((await api.mail("member@example.com")).text, "reset");
  const moved = await edit({
    username: "Builder",
    email: "Builder@Example.com",
  });
  assert.equal(moved.body.username, "Builder");
  assert.equal(moved.body.email, "builder@example.com");
  const subjects = [
    (await api.mail("builder@example.com")).subject,
    (await api.mail("builder@example.com")).subject,
  ].sort();
  assert.deepEqual(subjects, [
    "This email now signs in to Logistics Network",
    "Your Logistics Network username changed",
  ]);
  assert.match((await api.mail("member@example.com")).subject, /email changed/);
  const reset = await api.client().call("POST", "/api/reset/complete", {
    token: link,
    password: "a brand new gravel path",
  });
  assert.equal(reset.body.error, "link-expired");
  const login = await api
    .client()
    .call("POST", "/api/login", { login: "Builder", password });
  assert.equal(login.status, 200);
  assert.equal((await edit({ username: "Builder" })).status, 200);
  const log = (await admin.call("GET", "/api/admin/log")).body;
  assert.deepEqual(
    log.slice(0, 2).map((entry: { action: string }) => entry.action),
    ["user.email", "user.rename"],
  );
  assert.deepEqual(log[1].detail, { from: "Member", to: "Builder" });
  assert.equal(log[0].admin, "Boss");
  api.sql("UPDATE users SET username = 'Admin' WHERE id = 2");
  const kept = await edit({ username: " Admin ", email: "other@example.com" });
  assert.equal(kept.status, 200);
  assert.equal(kept.body.username, "Admin");
  assert.equal(kept.body.email, "other@example.com");
  assert.equal(
    api.row(
      "SELECT count(*) AS count FROM admin_log WHERE action = 'user.rename'",
    ).count,
    1,
  );
});

test("admin changes need a recent sign-in", async (t) => {
  const { api, admin, user } = await startAdmin(t);
  const signOut = (client: typeof admin) =>
    client.call("POST", "/api/admin/user/signout", { id: 2 });
  api.sql("UPDATE sessions SET authed_at = 0");
  assert.equal((await signOut(user)).body.error, "not-admin");
  assert.equal((await signOut(admin)).body.error, "reauth");
  assert.equal((await admin.call("GET", "/api/admin/users")).status, 200);
});

test("admins suspend and lift accounts but never another admin", async (t) => {
  const { api, admin, user } = await startAdmin(t);
  await user.call("POST", "/api/networks", sampleNetwork);
  const suspend = (id: number, suspended: boolean) =>
    admin.call("POST", "/api/admin/user/suspend", { id, suspended });
  assert.equal((await suspend(1, true)).body.error, "admin-target");
  const suspended = await suspend(2, true);
  assert.equal(suspended.body.locked, true);
  assert.equal(typeof suspended.body.suspendedAt, "number");
  assert.equal(
    api.row("SELECT count(*) AS count FROM sessions WHERE user_id = 2").count,
    0,
  );
  assert.match((await api.mail("member@example.com")).subject, /suspended/);
  const networks = (await admin.call("GET", "/api/admin/networks")).body;
  assert.equal(networks[0].hidden, true);
  const lifted = await suspend(2, false);
  assert.equal(lifted.body.locked, false);
  assert.equal(lifted.body.suspendedAt, null);
  assert.match((await api.mail("member@example.com")).subject, /active again/);
  const log = (await admin.call("GET", "/api/admin/log")).body;
  assert.deepEqual(
    log.map((entry: { action: string }) => entry.action),
    ["user.lift", "user.suspend"],
  );
});

test("admins sign users out and delete accounts", async (t) => {
  const { api, admin, user } = await startAdmin(t);
  await user.call("POST", "/api/networks", sampleNetwork);
  const call = (method: string, path: string, id: number) =>
    admin.call(method, path, { id });
  assert.equal(
    (await call("POST", "/api/admin/user/signout", 1)).body.error,
    "admin-target",
  );
  assert.equal((await call("POST", "/api/admin/user/signout", 2)).status, 204);
  assert.equal((await user.call("GET", "/api/me")).body, null);
  assert.match((await api.mail("member@example.com")).subject, /signed out/);
  assert.equal(
    (await call("DELETE", "/api/admin/user", 1)).body.error,
    "admin-target",
  );
  assert.equal((await call("DELETE", "/api/admin/user", 2)).status, 204);
  assert.match((await api.mail("member@example.com")).text, /"Member"/);
  assert.equal(api.row("SELECT count(*) AS count FROM networks").count, 0);
  assert.equal((await call("DELETE", "/api/admin/user", 2)).status, 404);
  const [entry] = (await admin.call("GET", "/api/admin/log")).body;
  assert.equal(entry.action, "user.delete");
  assert.deepEqual(entry.detail, {
    username: "Member",
    email: "member@example.com",
    networks: 1,
  });
});

test("log entries outlive a missing admin", async (t) => {
  const { api, admin } = await startAdmin(t);
  api.sql(
    "INSERT INTO admin_log (admin_id, action, target, detail, created_at) VALUES (99, 'test', 'user:2', '{}', 1)",
  );
  const [entry] = (await admin.call("GET", "/api/admin/log")).body;
  assert.equal(entry.admin, null);
});
