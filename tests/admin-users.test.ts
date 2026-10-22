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
