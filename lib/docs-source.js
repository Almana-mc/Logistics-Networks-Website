import { readStored, writeStored } from "./storage";

const GH_OWNER = "Almana-mc";
const GH_REPO = "LogisticsNetworks";
const GUIDE_DIR =
  "src/main/resources/assets/logisticsnetworks/guides/logisticsnetworks/guide";
const DEFAULT_BRANCH = "26.1.2";
const KNOWN_VERSIONS = ["26.1.2", "1.21.1", "1.20.1"];

const rawUrl = (rel, branch) =>
  `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${branch}/${GUIDE_DIR}/${rel}`;
const blobUrl = (rel, branch) =>
  `https://github.com/${GH_OWNER}/${GH_REPO}/blob/${branch}/${GUIDE_DIR}/${rel}`;
const guideRepoUrl = (branch) =>
  `https://github.com/${GH_OWNER}/${GH_REPO}/tree/${branch}/${GUIDE_DIR}`;

function resolvePath(baseDir, rel) {
  if (/^https?:/i.test(rel)) return rel;
  const stack = baseDir ? baseDir.split("/").filter(Boolean) : [];
  rel.split("/").forEach((seg) => {
    if (seg === "" || seg === ".") return;
    if (seg === "..") stack.pop();
    else stack.push(seg);
  });
  return stack.join("/");
}

function dirOf(rel) {
  const i = rel.lastIndexOf("/");
  return i === -1 ? "" : rel.slice(0, i);
}

function routeFromMdPath(p) {
  return p
    .replace(/\.md$/i, "")
    .replace(/(^|\/)index$/i, "")
    .replace(/\/$/, "");
}

const SECTION_ORDER = ["nodes", "filters", "computer", "wrench"];
const PAGE_ORDER = {
  nodes: [
    "header",
    "channel-settings",
    "filters-upgrades",
    "upgrades-performance",
    "upgrades-special",
  ],
  filters: ["small", "medium", "big", "advanced-filtering", "regex", "mod"],
  computer: ["network-directory", "node-table", "io-monitor", "save-load"],
  wrench: ["wrench-mode", "copy-paste", "mass-placement"],
};
const TITLES = {
  "": "Overview",
  links: "Links",
  nodes: "Nodes",
  filters: "Filters",
  computer: "Computer",
  wrench: "Wrench",
  header: "Header",
  "channel-settings": "Channel Settings",
  "filters-upgrades": "Filters & Upgrades",
  "upgrades-performance": "Performance Upgrades",
  "upgrades-special": "Special Upgrades",
  "advanced-filtering": "Advanced Filtering",
  regex: "Regex Matching",
  small: "Small Filter",
  medium: "Medium Filter",
  big: "Big Filter",
  mod: "Mod Filter",
  "io-monitor": "I/O Monitor",
  "network-directory": "Network Directory",
  "node-table": "Node Table",
  "save-load": "Save & Load",
  "wrench-mode": "Wrench Mode",
  "copy-paste": "Copy & Paste",
  "mass-placement": "Mass Placement",
};
function titleFor(key, base) {
  if (TITLES[key] != null) return TITLES[key];
  if (TITLES[base] != null) return TITLES[base];
  return base
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const FALLBACK_FILES = [
  "index.md",
  "links.md",
  "nodes/index.md",
  "nodes/header.md",
  "nodes/channel-settings.md",
  "nodes/filters-upgrades.md",
  "nodes/upgrades-performance.md",
  "nodes/upgrades-special.md",
  "filters/index.md",
  "filters/small.md",
  "filters/medium.md",
  "filters/big.md",
  "filters/advanced-filtering.md",
  "filters/regex.md",
  "filters/mod.md",
  "computer/index.md",
  "computer/network-directory.md",
  "computer/node-table.md",
  "computer/io-monitor.md",
  "computer/save-load.md",
  "wrench/index.md",
  "wrench/wrench-mode.md",
  "wrench/copy-paste.md",
  "wrench/mass-placement.md",
];

function orderPages(sec, names) {
  const hint = PAGE_ORDER[sec] || [];
  const bases = names
    .filter((n) => n !== "index.md")
    .map((n) => n.replace(/\.md$/, ""));
  bases.sort((a, b) => {
    const ia = hint.indexOf(a),
      ib = hint.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
  return bases.map((base) => ({
    key: `${sec}/${base}`,
    title: titleFor(`${sec}/${base}`, base),
    path: `${sec}/${base}.md`,
  }));
}

function buildNav(files) {
  const md = files.filter(
    (f) =>
      /\.md$/i.test(f) && !f.split("/").some((part) => part.startsWith("_")),
  );
  const root = md.filter((f) => !f.includes("/"));
  const bySection = {};
  md.filter((f) => f.includes("/")).forEach((f) => {
    const [sec, ...rest] = f.split("/");
    (bySection[sec] = bySection[sec] || []).push(rest.join("/"));
  });
  const keys = [
    ...SECTION_ORDER.filter((s) => bySection[s]),
    ...Object.keys(bySection)
      .filter((s) => !SECTION_ORDER.includes(s))
      .sort(),
  ];
  return {
    overview: root.includes("index.md")
      ? { key: "", title: "Overview", path: "index.md" }
      : null,
    sections: keys.map((sec) => ({
      key: sec,
      title: titleFor(sec, sec),
      path: `${sec}/index.md`,
      pages: orderPages(sec, bySection[sec]),
    })),
    extras: root
      .filter((f) => f !== "index.md")
      .map((f) => {
        const base = f.replace(/\.md$/, "");
        return { key: base, title: titleFor(base, base), path: f };
      }),
  };
}

function pathForKey(nav, key) {
  if (nav.overview && key === nav.overview.key) return nav.overview.path;
  for (const e of nav.extras) if (e.key === key) return e.path;
  for (const s of nav.sections) {
    if (s.key === key) return s.path;
    for (const p of s.pages) if (p.key === key) return p.path;
  }
  return null;
}

function flattenNav(nav) {
  return [
    ...(nav.overview ? [nav.overview] : []),
    ...nav.sections.flatMap((section) => [section, ...section.pages]),
    ...nav.extras,
  ];
}

function sectionForKey(nav, key) {
  if (!nav) return null;
  for (const s of nav.sections) {
    if (s.key === key) return s;
    if (s.pages.some((p) => p.key === key)) return s;
  }
  return null;
}

function cmpVersionDesc(a, b) {
  const pa = a.split(/[.-]/).map(Number);
  const pb = b.split(/[.-]/).map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pb[i] || 0 || 0) - (pa[i] || 0 || 0);
    if (!Number.isNaN(d) && d) return d;
  }
  return a < b ? 1 : -1;
}

const TREE_TTL = 60 * 60 * 1000;
function ghJson(url) {
  return fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
}

function fetchBranches() {
  const stored = readStored("ln-docs-branches");
  const cached =
    Array.isArray(stored?.data?.versions) &&
    stored.data.versions.every((value) => typeof value === "string") &&
    typeof stored.data.default === "string"
      ? stored
      : null;
  if (cached && Date.now() - cached.at < TREE_TTL)
    return Promise.resolve(cached.data);
  return Promise.all([
    ghJson(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}`).catch(
      () => ({}),
    ),
    ghJson(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/branches?per_page=100`,
    ).catch(() => []),
  ])
    .then(([repo, branches]) => {
      if (!branches.length)
        return (
          cached?.data || { versions: KNOWN_VERSIONS, default: DEFAULT_BRANCH }
        );
      const versions = (branches || [])
        .map((b) => b.name)
        .filter((n) => n.includes("."))
        .sort(cmpVersionDesc);
      let def = repo && repo.default_branch;
      if (!def || !def.includes(".")) def = versions[0] || DEFAULT_BRANCH;
      if (!versions.includes(def)) versions.unshift(def);
      const data = {
        versions: versions.length ? versions : [DEFAULT_BRANCH],
        default: def,
      };
      writeStored("ln-docs-branches", { at: Date.now(), data });
      return data;
    })
    .catch(() =>
      cached
        ? cached.data
        : { versions: KNOWN_VERSIONS, default: DEFAULT_BRANCH },
    );
}

function fetchGuideTree(branch) {
  const ck = "ln-docs-tree:" + branch;
  const stored = readStored(ck);
  const cached =
    Array.isArray(stored?.files) &&
    stored.files.every((value) => typeof value === "string")
      ? stored
      : null;
  if (cached && Date.now() - cached.at < TREE_TTL)
    return Promise.resolve(cached.files);
  return ghJson(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/git/trees/${branch}?recursive=1`,
  )
    .then((d) => {
      const prefix = GUIDE_DIR + "/";
      const files = (d.tree || [])
        .filter(
          (t) =>
            t.type === "blob" &&
            t.path.startsWith(prefix) &&
            t.path.endsWith(".md"),
        )
        .map((t) => t.path.slice(prefix.length));
      if (!files.length) throw new Error("empty tree");
      writeStored(ck, { at: Date.now(), files });
      return files;
    })
    .catch(() => (cached ? cached.files : FALLBACK_FILES));
}

export {
  DEFAULT_BRANCH,
  FALLBACK_FILES,
  KNOWN_VERSIONS,
  rawUrl,
  blobUrl,
  guideRepoUrl,
  resolvePath,
  dirOf,
  routeFromMdPath,
  buildNav,
  pathForKey,
  flattenNav,
  sectionForKey,
  fetchBranches,
  fetchGuideTree,
};
