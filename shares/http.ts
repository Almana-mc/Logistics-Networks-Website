import type { IncomingMessage, ServerResponse } from "node:http";

export class HttpError extends Error {
  status: number;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
  }
}

export function checkRequest(request: IncomingMessage, origin: string) {
  if (request.method === "GET") return;
  if (request.headers.origin !== origin) throw new HttpError(403, "bad-origin");
  if (!request.headers["content-type"]?.startsWith("application/json"))
    throw new HttpError(415, "json-required");
}

export async function readJson(request: IncomingMessage, limit: number) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, "too-large");
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

export function send(response: ServerResponse, status: number, body: unknown) {
  response
    .writeHead(status, { "Content-Type": "application/json" })
    .end(JSON.stringify(body));
}

export function clientIp(request: IncomingMessage, trustProxy: boolean) {
  const forwarded = request.headers["x-forwarded-for"];
  if (trustProxy && typeof forwarded === "string")
    return forwarded.split(",").at(-1)!.trim();
  return request.socket.remoteAddress || "unknown";
}

export function limitKey(ip: string) {
  const v4 = ip.replace(/^::ffff:/i, "");
  if (!v4.includes(":")) return v4;
  // Expand :: then keep /64
  const [head, tail] = ip.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const gap = ip.includes("::")
    ? Array<string>(8 - left.length - right.length).fill("0")
    : [];
  const groups = [...left, ...gap, ...right].slice(0, 4);
  return `${groups.map((group) => parseInt(group, 16).toString(16)).join(":")}::/64`;
}

// ponytail: in-memory, per-process, hourly sweep
export function createLimiter(enabled: boolean) {
  const entries = new Map<string, { count: number; reset: number }>();
  return {
    hit(key: string, max: number, span: number, now = Date.now()) {
      if (!enabled) return;
      const entry = entries.get(key);
      if (!entry || entry.reset <= now)
        return void entries.set(key, { count: 1, reset: now + span });
      entry.count += 1;
      if (entry.count > max) throw new HttpError(429, "rate-limited");
    },
    sweep(now = Date.now()) {
      for (const [key, entry] of entries)
        if (entry.reset <= now) entries.delete(key);
    },
  };
}
export type Limiter = ReturnType<typeof createLimiter>;
