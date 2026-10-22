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
    log.map((entry: { action: string }) => entry.action),
    ["network.delete", "network.edit"],
  );
  assert.deepEqual(log[1].detail, {
    from: { name: "Bee Automation", description: sampleNetwork.description },
    to: { name: "Hive", description: "Six hives" },
  });
});
