import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleNetwork, startAdmin } from "./api-client.ts";

test("admins edit and delete anyone's network and the owner is told", async (t) => {
  const { api, admin, user } = await startAdmin(t);
  const { id } = (await user.call("POST", "/api/networks", sampleNetwork)).body;
  assert.equal(
    (await user.call("GET", "/api/admin/networks")).body.error,
    "not-admin",
  );
  const listed = (await admin.call("GET", "/api/admin/networks")).body;
  assert.deepEqual(
    listed.map(
      (row: {
        id: string;
        author: string;
        userId: number;
        hidden: boolean;
      }) => [row.id, row.author, row.userId, row.hidden],
    ),
    [[id, "Member", 2, false]],
  );
  assert.equal("email" in listed[0], false);
  api.sql("UPDATE users SET suspended_at = 1 WHERE id = 2");
  const hidden = (await admin.call("GET", "/api/admin/networks")).body;
  assert.equal(hidden[0].hidden, true);
  assert.deepEqual((await api.client().call("GET", "/api/networks")).body, []);
  api.sql("UPDATE users SET suspended_at = NULL WHERE id = 2");
  const edit = (body: object) =>
    admin.call("PUT", "/api/admin/networks", {
      id,
      name: "Hive",
      description: "Six hives",
      ...body,
    });
  assert.equal((await edit({ name: "" })).body.error, "bad-name");
  assert.equal((await edit({ id: "nope" })).status, 404);
  const edited = await edit({});
  assert.equal(edited.body.name, "Hive");
  assert.equal(edited.body.hidden, false);
  assert.equal("email" in edited.body, false);
  assert.match((await api.mail("member@example.com")).text, /"Bee Automation"/);
  assert.equal(
    (await user.call("GET", "/api/me/networks")).body[0].name,
    "Hive",
  );
  assert.equal(
    (await admin.call("DELETE", "/api/admin/networks", { id })).status,
    204,
  );
  assert.match((await api.mail("member@example.com")).text, /"Hive"/);
  assert.equal(
    (await admin.call("DELETE", "/api/admin/networks", { id })).status,
    404,
  );
  const log = (await admin.call("GET", "/api/admin/log")).body;
  assert.deepEqual(
    log.map((entry: { action: string; target: string }) => [
      entry.action,
      entry.target,
    ]),
    [
      ["network.delete", `network:${id}`],
      ["network.edit", `network:${id}`],
    ],
  );
  assert.deepEqual(log[0].detail, { name: "Hive", author: "Member" });
  assert.deepEqual(log[1].detail, {
    from: { name: "Bee Automation", description: sampleNetwork.description },
    to: { name: "Hive", description: "Six hives" },
  });
});
