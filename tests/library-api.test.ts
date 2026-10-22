import { test } from "node:test";
import assert from "node:assert/strict";
import { networkSvg } from "../server/render.ts";
import {
  origin,
  sampleNetwork,
  signUp,
  startApi,
  type Api,
} from "./api-client.ts";

async function withForge(api: Api) {
  const owner = api.client();
  await signUp(api, owner, "Keeper", "keeper@example.com");
  const { id } = (
    await owner.call("POST", "/api/networks", {
      ...sampleNetwork,
      name: "Lava Forge",
      description: "Smelts ore with lava",
      types: ["FLUID"],
    })
  ).body;
  return { owner, id: id as string };
}

test("search merges curated and community networks", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const { id } = await withForge(api);
  const all = (await api.client().call("GET", "/api/library/search")).body;
  assert.equal(all.total, 4);
  assert.equal(all.results[0].id, id);
  assert.equal(all.results[0].source, "community");
  assert.deepEqual(all.results[0].links, {
    visualiser: `${origin}/visualiser.html?network=${id}`,
    file: `${origin}/api/networks/file?id=${id}`,
    image: `${origin}/api/library/image.png?id=${id}`,
  });
  const bees = all.results.find(
    (entry: { id: string }) => entry.id === "bee-automation.lnet",
  );
  assert.equal(bees.source, "curated");
  assert.equal(bees.createdAt, Date.parse("2026-06-07"));
  assert.equal(bees.links.file, `${origin}/library/bee-automation.lnet`);
  assert.equal(
    bees.links.visualiser,
    `${origin}/visualiser.html?net=bee-automation.lnet`,
  );
});

test("search filters, sorts and pages", async (t) => {
  const api = await startApi();
  t.after(api.close);
  await withForge(api);
  const guest = api.client();
  const search = async (query: string) =>
    (await guest.call("GET", `/api/library/search?${query}`)).body;
  const names = async (query: string) =>
    (await search(query)).results.map((entry: { name: string }) => entry.name);
  assert.deepEqual(await names("q=BEE%20pilpoh"), ["Pilpoh's Bee Setup"]);
  assert.deepEqual(await names("author=almanax21&sort=name"), [
    "Bee Automation",
    "Eldritch Automation",
  ]);
  assert.deepEqual(await names("type=fluid&source=community"), ["Lava Forge"]);
  assert.equal((await search("type=FLUID,ENERGY")).total, 3);
  const page = await search("sort=name&limit=2&offset=1");
  assert.equal(page.total, 4);
  assert.deepEqual(
    page.results.map((entry: { name: string }) => entry.name),
    ["Eldritch Automation", "Lava Forge"],
  );
  assert.equal((await search("limit=0")).results.length, 0);
  assert.equal((await search("type=LAVA")).error, "bad-type");
  assert.equal((await search("source=mine")).error, "bad-source");
  api.sql("UPDATE users SET suspended_at = 1");
  assert.equal((await search("source=community")).total, 0);
});

test("search finds ids and says when nothing changed", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const { owner, id } = await withForge(api);
  const guest = api.client();
  const search = (query: string, tag = "") =>
    guest.call("GET", `/api/library/search?${query}`, undefined, {
      "If-None-Match": tag,
    });
  const names = async (query: string) =>
    (await search(query)).body.results.map(
      (entry: { name: string }) => entry.name,
    );
  assert.deepEqual(await names(`q=${id}`), ["Lava Forge"]);
  assert.deepEqual(await names("q=%20eldritch-automation.lnet"), [
    "Eldritch Automation",
  ]);
  const tag = (await search("sort=name&limit=1")).headers.get("etag")!;
  assert.match(tag, /^"[A-Za-z0-9_-]{27}"$/);
  const same = await search("sort=name&limit=1", tag);
  assert.equal(same.status, 304);
  assert.equal(same.body, undefined);
  assert.notEqual((await search("sort=name&limit=2")).headers.get("etag"), tag);
  await owner.call("PUT", "/api/networks", {
    id,
    name: "Lava Works",
    description: "Smelts ore with lava",
  });
  const changed = await search("sort=name&limit=1", tag);
  assert.equal(changed.status, 200);
  assert.equal(changed.body.results[0].name, "Bee Automation");
  assert.notEqual(changed.headers.get("etag"), tag);
});

test("rate-limited replies say when to retry", async (t) => {
  const api = await startApi({ rateLimits: true });
  t.after(api.close);
  const guest = api.client();
  for (let index = 0; index < 300; index++)
    await guest.call("GET", "/api/library/search?limit=0");
  const refused = await guest.call("GET", "/api/library/search?limit=0");
  assert.equal(refused.status, 429);
  assert.equal(refused.body.error, "rate-limited");
  const wait = Number(refused.headers.get("retry-after"));
  assert.ok(wait > 0 && wait <= 300);
});

test("network details include stats and nodes", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const { id } = await withForge(api);
  const guest = api.client();
  const detail = async (lookup: string) =>
    guest.call("GET", `/api/library/network?id=${lookup}`);
  const forge = (await detail(id)).body;
  assert.equal(forge.name, "Lava Forge");
  assert.equal(forge.stats.nodes, 6);
  assert.equal(forge.nodes.length, 6);
  assert.equal(typeof forge.nodes[0].label, "string");
  const curated = (await detail("eldritch-automation.lnet")).body;
  assert.equal(curated.source, "curated");
  assert.deepEqual(
    curated.nodes.map((node: { label: string }) => node.label).sort(),
    ["Mineshaft", "Ore Store", "XP Tank"],
  );
  for (const missing of ["nope", "..%2Fpackage.json", "..%2Findex.lnet"])
    assert.equal((await detail(missing)).status, 404);
});

test("unreadable and oversized networks are refused", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const { owner } = await withForge(api);
  const publish = async (lnet: string) =>
    (await owner.call("POST", "/api/networks", { ...sampleNetwork, lnet })).body
      .id;
  const broken = await publish("version=1.0\nhello");
  const huge = await publish(
    `version=1.0\nnetwork=Huge\n${"label=Box\nclipboard={}\n".repeat(301)}`,
  );
  const reply = async (id: string) =>
    (await owner.call("GET", `/api/library/network?id=${id}`)).body.error;
  assert.equal(await reply(broken), "unreadable-network");
  assert.equal(await reply(huge), "too-many-nodes");
});

test("network images render as cached PNGs", async (t) => {
  const api = await startApi();
  t.after(api.close);
  const { owner, id } = await withForge(api);
  const image = (lookup: string) =>
    fetch(`${api.base}/api/library/image.png?id=${lookup}`);
  for (const lookup of [id, "bee-automation.lnet"]) {
    const response = await image(lookup);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.equal(
      response.headers.get("cache-control"),
      "public, max-age=86400",
    );
    const png = Buffer.from(await response.arrayBuffer());
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1600, 900]);
  }
  await owner.call("DELETE", "/api/networks", { id });
  assert.equal((await image(id)).status, 404);
});

test("drawn labels are escaped and lone nodes stay finite", () => {
  const svg = networkSvg({
    network: "Solo",
    nodes: [
      {
        label: `<script>"x"\u0001 & 'y'</script>`,
        visible: true,
        config: { activeChannels: [] },
      },
    ],
    topology: [],
    stats: { nodes: 1, hidden: 0, links: 0, activeChannels: 0, types: {} },
  });
  assert.ok(!svg.includes("<script"));
  assert.ok(svg.includes("&#60;script&#62;&#34;x&#34; &#38; …"));
  assert.ok(!svg.includes("NaN"));
});
