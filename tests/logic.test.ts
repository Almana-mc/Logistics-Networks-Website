import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { filterEntries, libraryFile, normalizeEntry } from "../lib/library";
import { readStored, writeStored } from "../lib/storage";
import { mdLink, parseMarkdown } from "../lib/docs-markdown";
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
