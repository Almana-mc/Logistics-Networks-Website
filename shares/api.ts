import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { DatabaseSync } from "node:sqlite";
import { checkLnet, cleanName } from "./checks.ts";
import {
  HttpError,
  checkRequest,
  clientIp,
  createLimiter,
  limitKey,
  readJson,
  send,
  type Limiter,
} from "./http.ts";
import {
  findShare,
  openStore,
  saveShare,
  storedBytes,
  sweep,
} from "./store.ts";

export type Config = {
  origin: string;
  dbPath: string;
  trustProxy: boolean;
  rateLimits: boolean;
  quota: number;
};

export const readConfig = (env: NodeJS.ProcessEnv = process.env): Config => ({
  origin: env.ORIGIN || "http://localhost:8794",
  dbPath: env.DB_PATH || ".data/shares.db",
  trustProxy: env.TRUST_PROXY === "1",
  rateLimits: env.RATE_LIMITS !== "off",
  quota: (Number(env.SHARE_QUOTA_MB) || 256) * 1_048_576,
});

const hour = 3_600_000;
const shareLife = 12 * hour;
const idPattern = /^[A-Za-z0-9_-]{11}$/;

type Context = {
  request: IncomingMessage;
  response: ServerResponse;
  url: URL;
  db: DatabaseSync;
  config: Config;
  limiter: Limiter;
  key: string;
};
type Handler = (context: Context) => Promise<void> | void;

async function create(context: Context) {
  const { request, response, db, config, limiter, key } = context;
  limiter.hit(`hour:${key}`, 10, hour);
  limiter.hit(`day:${key}`, 30, 24 * hour);
  limiter.hit("all", 300, hour);
  const body = await readJson(request, 1_048_576);
  const size = checkLnet(body.lnet);
  const name = cleanName(body.name);
  const now = Date.now();
  if (storedBytes(db, now) + size > config.quota)
    throw new HttpError(503, "shares-full");
  const id = randomBytes(8).toString("base64url");
  const expiresAt = now + shareLife;
  saveShare(db, { id, name, lnet: body.lnet as string, size, expiresAt });
  send(response, 201, { id, expiresAt });
}

function read({ response, url, db, limiter, key }: Context) {
  limiter.hit(`read:${key}`, 120, 5 * 60_000);
  const id = url.searchParams.get("id") || "";
  const share = idPattern.test(id) ? findShare(db, id, Date.now()) : undefined;
  if (!share) throw new HttpError(404, "share-gone");
  send(response, 200, {
    name: share.name,
    lnet: share.lnet,
    expiresAt: share.expires_at,
  });
}

const routes: Record<string, Handler | undefined> = {
  "POST /api/shares": create,
  "GET /api/shares": read,
};

// Messages may hold user input
const frames = (error: unknown) =>
  String((error as Error).stack)
    .split("\n")
    .slice(1, 4)
    .join(" |");

function fail(
  request: IncomingMessage,
  response: ServerResponse,
  error: unknown,
) {
  const known = error instanceof HttpError;
  const aborted = request.destroyed && !request.complete;
  if (!known && !aborted)
    console.error(`Unhandled ${(error as Error).name}:${frames(error)}`);
  if (response.headersSent) return;
  if (aborted) response.setHeader("Connection", "close");
  send(response, known ? error.status : 500, {
    error: known ? error.message : "server",
  });
}

export function createShareApi(config: Config) {
  const db = openStore(config.dbPath);
  const limiter = createLimiter(config.rateLimits);
  sweep(db);
  setInterval(() => {
    sweep(db);
    limiter.sweep();
  }, hour).unref();
  return async (request: IncomingMessage, response: ServerResponse) => {
    response.setHeader("Cache-Control", "no-store");
    try {
      const url = URL.parse(request.url || "/", config.origin);
      if (!url) throw new HttpError(404, "not-found");
      const handler = routes[`${request.method} ${url.pathname}`];
      if (!handler) throw new HttpError(404, "not-found");
      checkRequest(request, config.origin);
      const key = limitKey(clientIp(request, config.trustProxy));
      await handler({ request, response, url, db, config, limiter, key });
    } catch (error) {
      fail(request, response, error);
    }
  };
}
