import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { signUp, startApi } from "./api-client.ts";

const lnet = await readFile("library/bee-automation.lnet", "utf8");
const network = {
  name: "Bee Automation",
  description: "A simple Productive Bees setup",
  lnet,
  types: ["ITEM", "FLUID", "LAVA"],
};

test("signed-in users publish networks everyone can list and open", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const guest = api.client();
  assert.equal(
    (await guest.call("POST", "/api/networks", network)).body.error,
    "signed-out",
  );
  const owner = api.client();
  await signUp(api, owner, "Keeper", "keeper@example.com");
  const created = await owner.call("POST", "/api/networks", {
    ...network,
    name: "  Bee\nAutomation​  ",
  });
  assert.equal(created.status, 201);
  assert.match(created.body.id, /^[A-Za-z0-9_-]{11}$/);
  assert.deepEqual(
    { ...created.body, id: "", createdAt: 0 },
    {
      id: "",
      name: "Bee Automation",
      description: network.description,
      author: "Keeper",
      types: ["ITEM", "FLUID"],
      createdAt: 0,
    },
  );
  const listed = await guest.call("GET", "/api/networks");
  assert.deepEqual(listed.body, [created.body]);
  assert.equal(listed.body[0].lnet, undefined);
  const file = await fetch(
    `${api.base}/api/networks/file?id=${created.body.id}`,
  );
  assert.equal(file.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(await file.text(), lnet);
  const missing = await guest.call("GET", "/api/networks/file?id=nope");
  assert.equal(missing.status, 404);
  assert.deepEqual((await owner.call("GET", "/api/me/networks")).body, [
    created.body,
  ]);
  assert.equal((await guest.call("GET", "/api/me/networks")).status, 401);
});

test("publishing checks the file, the details and the quota", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const client = api.client();
  await signUp(api, client, "Checker", "checker@example.com");
  const attempt = async (body: object) =>
    (await client.call("POST", "/api/networks", { ...network, ...body })).body
      .error;
  assert.equal(await attempt({ name: " \n " }), "bad-name");
  assert.equal(await attempt({ name: "n".repeat(81) }), "bad-name");
  assert.equal(await attempt({ description: "" }), "bad-description");
  assert.equal(
    await attempt({ description: "d".repeat(301) }),
    "bad-description",
  );
  assert.equal(await attempt({ lnet: "hello" }), "bad-network");
  assert.equal(await attempt({ lnet: 42 }), "bad-network");
  assert.equal(
    await attempt({ lnet: `version=1\n${"x".repeat(524_288)}` }),
    "too-large",
  );
  for (let index = 0; index < 50; index++)
    api.sql(
      "INSERT INTO networks (id, user_id, name, description, types, lnet, created_at) VALUES (?, 1, 'n', 'd', '', 'version=1', 0)",
      `filler-${index}`,
    );
  assert.equal(await attempt({}), "network-limit");
});

test("only the owner edits or deletes a network", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const owner = api.client();
  const other = api.client();
  await signUp(api, owner, "Owner", "owner@example.com");
  await signUp(api, other, "Other", "other@example.com");
  const { id } = (await owner.call("POST", "/api/networks", network)).body;
  const edit = { id, name: "Hive", description: "Six hives, one honey line" };
  assert.equal((await other.call("PUT", "/api/networks", edit)).status, 404);
  assert.equal(
    (await other.call("DELETE", "/api/networks", { id })).status,
    404,
  );
  const edited = await owner.call("PUT", "/api/networks", edit);
  assert.equal(edited.body.name, "Hive");
  assert.equal(edited.body.description, "Six hives, one honey line");
  assert.equal(
    (await owner.call("PUT", "/api/networks", { ...edit, name: "" })).body
      .error,
    "bad-name",
  );
  assert.equal(
    (await owner.call("DELETE", "/api/networks", { id })).status,
    204,
  );
  assert.deepEqual((await owner.call("GET", "/api/networks")).body, []);
  assert.equal(
    (await owner.call("DELETE", "/api/networks", { id })).status,
    404,
  );
});
