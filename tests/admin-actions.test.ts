import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleNetwork, signUp, startAdmin, tokenIn } from "./api-client.ts";

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
  assert.equal(
    (await admin.call("POST", "/api/admin/user/suspend", { id: 2 })).body.error,
    "bad-request",
  );
  assert.equal((await suspend(1, true)).body.error, "admin-target");
  const suspended = await suspend(2, true);
  assert.equal(suspended.body.locked, true);
  assert.equal(typeof suspended.body.suspendedAt, "number");
  assert.equal(
    api.row("SELECT count(*) AS count FROM sessions WHERE user_id = 2").count,
    0,
  );
  assert.match((await api.mail("member@example.com")).subject, /suspended/);
  await suspend(2, true);
  assert.equal(
    api.row(
      "SELECT count(*) AS count FROM admin_log WHERE action = 'user.suspend'",
    ).count,
    1,
  );
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
  await suspend(2, true);
  await api.mail("member@example.com");
  await admin.call("POST", "/api/admin/blocks", {
    pattern: "member@example.com",
  });
  await suspend(2, false);
  await assert.rejects(api.mail("member@example.com"));
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
  await api
    .client()
    .call("POST", "/api/reset", { email: "member@example.com" });
  const link = tokenIn((await api.mail("member@example.com")).text, "reset");
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
  const fresh = await signUp(api, api.client(), "Fresh", "fresh@example.com");
  assert.equal(fresh.body.user.id, 2);
  const reset = await api.client().call("POST", "/api/reset/complete", {
    token: link,
    password: "a brand new gravel path",
  });
  assert.equal(reset.body.error, "link-expired");
});

test("log entries outlive a missing admin", async (t) => {
  const { api, admin } = await startAdmin(t);
  api.sql(
    "INSERT INTO admin_log (admin_id, action, target, detail, created_at) VALUES (99, 'test', 'user:2', '{}', 1)",
  );
  const [entry] = (await admin.call("GET", "/api/admin/log")).body;
  assert.equal(entry.admin, null);
});
