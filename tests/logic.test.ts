import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { filterEntries, libraryFile, normalizeEntry } from "../lib/library";
import { readStored, writeStored } from "../lib/storage";
import { mdLink, parseMarkdown } from "../lib/docs-markdown";
import { readCount } from "../lib/downloads";
import { buildHeroNetwork } from "../lib/hero-network";
import { afterFirstPaint } from "../lib/first-paint";
import {
  buildNav,
  flattenNav,
  routeFromMdPath,
  fetchBranches,
} from "../lib/docs-source";

test("English guide navigation excludes locale folders and resolves index links", () => {
  const nav = buildNav([
    "index.md",
    "nodes/index.md",
    "nodes/header.md",
    "_zh_cn/nodes/index.md",
  ]);
  assert.deepEqual(
    nav.sections.map((section) => section.key),
    ["nodes"],
  );
  assert.equal(routeFromMdPath("nodes/index.md"), "nodes");
});

test("manifest normalization and filtering preserve real entries", async () => {
  const raw = JSON.parse(await readFile("library/index.json", "utf8"));
  const entries = raw.map(normalizeEntry).filter(Boolean);
  assert.equal(entries.length, 3);
  assert.equal(filterEntries(entries, "pilpoh", [], "new").length, 1);
  assert.equal(filterEntries(entries, "", ["FLUID"], "name").length, 2);
  assert.deepEqual(filterEntries(entries, "missing", [], "name"), []);
  assert.equal(normalizeEntry({ ...raw[0], file: "../private.lnet" }), null);
  assert.equal(normalizeEntry(null), null);
  assert.equal(entries[0].name, "Pilpoh's Bee Setup");
});

test("library filenames cannot escape the library path", () => {
  assert.equal(libraryFile("bee setup.lnet"), "library/bee%20setup.lnet");
  for (const path of [
    "../file.lnet",
    "..\\file.lnet",
    "https://host/a.lnet",
    "file.lnet?x",
    "file.png",
  ])
    assert.throws(() => libraryFile(path));
});

test("optional cache recovers from malformed and unavailable storage", () => {
  const values = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  writeStored("valid", { value: 42 });
  assert.deepEqual(readStored("valid"), { value: 42 });
  values.set("broken", "{");
  assert.equal(readStored("broken"), null);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get: () => {
      throw new Error("Disabled");
    },
  });
  assert.equal(readStored("valid"), null);
  assert.doesNotThrow(() => writeStored("test", 1));
});

test("remote markdown rejects unsafe links and preserves guide routes", () => {
  const text = ["Read"];
  const unsafe = renderToStaticMarkup(
    mdLink(text, "javascript:alert(1)", "", "a"),
  );
  assert.ok(!unsafe.includes("href="));
  const relative = renderToStaticMarkup(
    mdLink(text, "../filters/index.md", "nodes", "b"),
  );
  assert.ok(
    relative.includes('href="#filters/"') ||
      relative.includes('href="#filters"'),
  );
  const external = renderToStaticMarkup(
    mdLink(text, "https://example.com/guide", "", "c"),
  );
  assert.ok(external.includes("https://example.com/guide"));
});

test("rate-limited version discovery keeps known guides available", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("", { status: 403 });
  try {
    assert.deepEqual((await fetchBranches()).versions, [
      "26.1.2",
      "1.21.1",
      "1.20.1",
    ]);
  } finally {
    globalThis.fetch = original;
  }
});

test("frontmatter-only titles produce exactly one heading", () => {
  const page = parseMarkdown(
    "---\ntitle: Channel settings\n---\n\nConfigure a channel.\n\n## Batch\nEight items.",
    "nodes/channel-settings.md",
    "26.1.2",
  );
  const html = renderToStaticMarkup(createElement("article", {}, page.blocks));
  assert.equal((html.match(/<h1/g) || []).length, 1);
});

test("all bundled exports retain their parser results", async () => {
  Object.defineProperty(globalThis, "window", {
    value: {},
    configurable: true,
  });
  const { parseNetwork } = await import("../lib/network");
  for (const [file, nodes, links, channels] of [
    ["pilpohs-bee-setup.lnet", 5, 7, 13],
    ["eldritch-automation.lnet", 3, 3, 6],
    ["bee-automation.lnet", 6, 6, 11],
  ] as const) {
    const result = parseNetwork(await readFile(`library/${file}`, "utf8"));
    assert.equal(result.stats.nodes, nodes);
    assert.equal(result.stats.links, links);
    assert.equal(result.stats.activeChannels, channels);
    assert.equal(result.warnings.length, 0);
  }
  assert.throws(() => parseNetwork("invalid network"), /header/);
});

test("flattened guide order drives previous and next pages", () => {
  const keys = (files: string[]) =>
    flattenNav(buildNav(files)).map((page) => page.key);
  assert.deepEqual(
    keys(["links.md", "nodes/header.md", "index.md", "nodes/index.md"]),
    ["", "nodes", "nodes/header", "links"],
  );
  assert.deepEqual(keys(["filters/small.md"]), ["filters", "filters/small"]);
});

test("download counts accept both sources and reject bad values", () => {
  assert.equal(readCount({ downloads: { total: 3674267 } }), 3674267);
  assert.equal(
    readCount({ projects: { "logistics-network": { raw: 42 } } }),
    42,
  );
  for (const bad of [
    null,
    {},
    { downloads: { total: "9" } },
    { downloads: { total: 0 } },
  ])
    assert.equal(readCount(bad), null);
});

test("first paint gate waits for a paint entry when supported", async () => {
  await afterFirstPaint();
  const original = globalThis.PerformanceObserver;
  let paint: () => void = () => assert.fail("observer never created");
  let disconnected = false;
  class Observer {
    static supportedEntryTypes = ["paint"];
    constructor(callback: (list: null, observer: Observer) => void) {
      paint = () => callback(null, this);
    }
    observe() {}
    disconnect() {
      disconnected = true;
    }
  }
  globalThis.PerformanceObserver =
    Observer as unknown as typeof PerformanceObserver;
  try {
    let done = false;
    const gate = afterFirstPaint().then(() => (done = true));
    await Promise.resolve();
    assert.equal(done, false);
    paint();
    await gate;
    assert.equal(disconnected, true);
  } finally {
    globalThis.PerformanceObserver = original;
  }
});

test("hero network is deterministic and stays in range", () => {
  const first = buildHeroNetwork(7);
  assert.deepEqual(first.edges, buildHeroNetwork(7).edges);
  assert.equal(first.nodes.length, 16);
  for (const edge of first.edges) {
    assert.notEqual(edge.from, edge.to);
    assert.ok(edge.to < 16 && edge.from < 16);
  }
});

test("item ids read as names and release tags split into versions", async () => {
  const { itemName } = await import("../lib/items");
  const { splitVersion } = await import("../lib/release");
  assert.equal(itemName("logisticsnetworks:small_filter"), "Small Filter");
  assert.equal(itemName("stone"), "Stone");
  assert.equal(itemName("mod:double__gap"), "Double Gap");
  assert.deepEqual(splitVersion("v26.1.2-1.13.0"), {
    minecraft: "26.1.2",
    mod: "1.13.0",
  });
  assert.deepEqual(splitVersion("1.21-2.0.0-beta"), {
    minecraft: "1.21",
    mod: "2.0.0-beta",
  });
  assert.equal(splitVersion("v1.13.0"), null);
  assert.equal(splitVersion(""), null);
});

test("graph data mirrors parsed nodes and marks hidden nodes", async () => {
  if (!("window" in globalThis))
    Object.defineProperty(globalThis, "window", {
      value: {},
      configurable: true,
    });
  const { parseNetwork, graphData } = await import("../lib/network");
  const network = parseNetwork(
    await readFile("library/eldritch-automation.lnet", "utf8"),
  );
  const data = graphData(network, 6);
  assert.equal(data.nodes.length, network.nodes.length);
  assert.equal(data.edges, network.topology);
  assert.ok(data.nodes.every((node) => node.baseR === 6));
  network.nodes[0].visible = false;
  assert.deepEqual(graphData(network).nodes[0], {
    label: network.nodes[0].label,
    dominantType: null,
    role: "hidden",
    baseR: 11,
  });
});
