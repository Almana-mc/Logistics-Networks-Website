import { test } from "node:test";
import assert from "node:assert/strict";
import { startAdmin } from "./api-client.ts";
import { readConfig } from "../server/config.ts";

test("only listed ids are admins", async (t) => {
  assert.deepEqual(readConfig({ ADMIN_IDS: "2, 7,x,-1" }).adminIds, [2, 7]);
  assert.deepEqual(readConfig({}).adminIds, []);
  const { api, admin, user } = await startAdmin(t);
  assert.equal((await admin.call("GET", "/api/me")).body.admin, true);
  assert.equal((await user.call("GET", "/api/me")).body.admin, false);
  assert.equal((await api.client().call("GET", "/api/me")).body, null);
});
