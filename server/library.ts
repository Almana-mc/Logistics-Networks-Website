import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { IncomingMessage } from "node:http";
import type { Context, Routes } from "./context.ts";
import { HttpError, param, send } from "./http.ts";
import { parseLnet } from "./lnet.ts";
import { listNetworks, typeIds } from "./networks.ts";
import { networkPng } from "./render.ts";
import { active } from "./users.ts";

type Entry = {
  id: string;
  source: "curated" | "community";
  name: string;
  description: string;
  author: string;
  types: string[];
  createdAt: number;
};
type Curated = {
  name: string;
  author: string;
  desc: string;
  file: string;
  types: string[];
  added: string;
};

const span = 5 * 60_000;
const maxNodes = 300;
const images = new Map<string, Buffer>();

const curated = (dir: string): Entry[] =>
  (JSON.parse(readFileSync(join(dir, "index.json"), "utf8")) as Curated[]).map(
    (entry) => ({
      id: entry.file,
      source: "curated",
      name: entry.name,
      description: entry.desc,
      author: entry.author,
      types: entry.types,
      createdAt: Date.parse(entry.added),
    }),
  );

const community = (context: Context, where = "", ...params: string[]) =>
  listNetworks(context.db, `WHERE ${active} ${where}`, ...params).map(
    (network): Entry => ({ ...network, source: "community" }),
  );

function withLinks(origin: string, entry: Entry) {
  const id = encodeURIComponent(entry.id);
  const isCurated = entry.source === "curated";
  return {
    ...entry,
    links: {
      visualiser: `${origin}/visualiser.html?${isCurated ? "net" : "network"}=${id}`,
      file: isCurated
        ? `${origin}/library/${id}`
        : `${origin}/api/networks/file?id=${id}`,
      image: `${origin}/api/library/image.png?id=${id}`,
    },
  };
}

function matcher(request: IncomingMessage) {
  const terms = param(request, "q").toLowerCase().split(/\s+/).filter(Boolean);
  const author = param(request, "author").toLowerCase();
  const source = param(request, "source");
  const types = param(request, "type").toUpperCase().split(",").filter(Boolean);
  if (types.some((type) => !typeIds.includes(type)))
    throw new HttpError(400, "bad-type");
  if (source && source !== "curated" && source !== "community")
    throw new HttpError(400, "bad-source");
  return (entry: Entry) =>
    terms.every((term) =>
      `${entry.name} ${entry.author} ${entry.description}`
        .toLowerCase()
        .includes(term),
    ) &&
    (!author || entry.author.toLowerCase() === author) &&
    (!source || entry.source === source) &&
    (!types.length || entry.types.some((type) => types.includes(type)));
}

const count = (value: string, fallback: number, max: number) => {
  const number = Number.parseInt(value, 10);
  return Number.isNaN(number) ? fallback : Math.min(Math.max(number, 0), max);
};

function readEntry(context: Context) {
  const id = param(context.request, "id");
  const dir = context.config.libraryDir;
  const entry = id.endsWith(".lnet")
    ? curated(dir).find((item) => item.id === id)
    : community(context, "AND n.id = ?", id)[0];
  if (!entry) throw new HttpError(404, "not-found");
  const lnet =
    entry.source === "curated"
      ? readFileSync(join(dir, entry.id), "utf8")
      : (
          context.db
            .prepare("SELECT lnet FROM networks WHERE id = ?")
            .get(id) as { lnet: string }
        ).lnet;
  return { entry, lnet };
}

// ponytail: node cap bounds parse memory
function parse(lnet: string) {
  if ((lnet.match(/^\s*(label|node)\s*=/gim) || []).length > maxNodes)
    throw new HttpError(422, "too-many-nodes");
  try {
    return parseLnet(lnet);
  } catch {
    throw new HttpError(422, "unreadable-network");
  }
}

// ponytail: per-process cache, oldest evicted first
function remember(id: string, png: Buffer) {
  images.set(id, png);
  if (images.size > 100) images.delete(images.keys().next().value!);
}

export const libraryRoutes: Routes = {
  "GET /api/library/search": (context) => {
    const { request, config } = context;
    context.limit(`library:${context.ip}`, 300, span);
    const found = [...curated(config.libraryDir), ...community(context)]
      .filter(matcher(request))
      .sort((a, b) =>
        param(request, "sort") === "name"
          ? a.name.localeCompare(b.name)
          : b.createdAt - a.createdAt,
      );
    const offset = count(param(request, "offset"), 0, found.length);
    const limit = count(param(request, "limit"), 20, 50);
    send(context.response, 200, {
      total: found.length,
      results: found
        .slice(offset, offset + limit)
        .map((entry) => withLinks(config.origin, entry)),
    });
  },
  "GET /api/library/network": (context) => {
    context.limit(`library:${context.ip}`, 300, span);
    const { entry, lnet } = readEntry(context);
    const network = parse(lnet);
    send(context.response, 200, {
      ...withLinks(context.config.origin, entry),
      stats: network.stats,
      nodes: network.nodes.map((node) => ({
        label: node.label,
        visible: node.visible,
        type: node.config.activeChannels[0]?.type ?? null,
      })),
    });
  },
  "GET /api/library/image.png": async (context) => {
    const { entry, lnet } = readEntry(context);
    let png = images.get(entry.id);
    if (!png) {
      context.limit(`render:${context.ip}`, 30, span);
      png = await networkPng(parse(lnet));
      remember(entry.id, png);
    }
    context.response
      .writeHead(200, {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      })
      .end(png);
  },
};
