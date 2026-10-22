import type { IncomingMessage, ServerResponse } from "node:http";

export class HttpError extends Error {
  status: number;
  retryAfter?: number;
  constructor(status: number, code: string, retryAfter?: number) {
    super(code);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export function checkRequest(request: IncomingMessage, origin: string) {
  if (request.method === "GET") return;
  if (request.headers.origin !== origin) throw new HttpError(403, "bad-origin");
  if (!request.headers["content-type"]?.startsWith("application/json"))
    throw new HttpError(415, "json-required");
}

export async function readJson(request: IncomingMessage, limit = 16_384) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > limit) {
      throw new HttpError(413, "too-large");
    }
    chunks.push(chunk);
  }
  const body = parse(Buffer.concat(chunks).toString("utf8"));
  if (typeof body !== "object" || body === null || Array.isArray(body))
    throw new HttpError(400, "bad-json");
  return body as Record<string, unknown>;
}

function parse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function readCookie(request: IncomingMessage, name: string) {
  for (const part of (request.headers.cookie || "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return undefined;
}

export function clientIp(request: IncomingMessage, trustProxy: boolean) {
  const forwarded = request.headers["x-forwarded-for"];
  if (trustProxy && typeof forwarded === "string")
    return forwarded.split(",").at(-1)!.trim();
  return request.socket.remoteAddress || "unknown";
}

export function send(response: ServerResponse, status: number, body?: unknown) {
  if (body === undefined) return void response.writeHead(status).end();
  response
    .writeHead(status, { "Content-Type": "application/json" })
    .end(JSON.stringify(body));
}

// ponytail: in-memory, single process only
export function createLimiter(enabled: boolean) {
  const entries = new Map<string, { count: number; reset: number }>();
  return {
    hit(key: string, max: number, span: number, now = Date.now()) {
      if (!enabled) return;
      const entry = entries.get(key);
      if (!entry || entry.reset <= now)
        return void entries.set(key, { count: 1, reset: now + span });
      entry.count += 1;
      if (entry.count > max)
        throw new HttpError(
          429,
          "rate-limited",
          Math.ceil((entry.reset - now) / 1000),
        );
    },
    sweep(now = Date.now()) {
      for (const [key, entry] of entries)
        if (entry.reset <= now) entries.delete(key);
    },
  };
}
export type Limiter = ReturnType<typeof createLimiter>;
export const param = (request: IncomingMessage, key: string) =>
  new URL(request.url || "/", "http://local").searchParams.get(key) ?? "";
