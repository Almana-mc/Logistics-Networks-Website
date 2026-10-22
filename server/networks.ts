import { randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { Context, Routes } from "./context.ts";
import { HttpError, send } from "./http.ts";
import { active } from "./users.ts";

export type Row = {
  id: string;
  name: string;
  description: string;
  types: string;
  author: string;
  created_at: number;
};

const hour = 3_600_000;
const perUser = 50;
export const typeIds = ["ITEM", "FLUID", "ENERGY", "CHEMICAL", "SOURCE"];
const select = `SELECT n.id, n.name, n.description, n.types, n.created_at, u.username AS author
  FROM networks n JOIN users u ON u.id = n.user_id`;

export const publicNetwork = (row: Row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  author: row.author,
  types: row.types ? row.types.split(",") : [],
  createdAt: row.created_at,
});

const findNetwork = (db: DatabaseSync, id: string) =>
  publicNetwork(db.prepare(`${select} WHERE n.id = ?`).get(id) as Row);

export const listNetworks = (
  db: DatabaseSync,
  where = "",
  ...params: (string | number)[]
) =>
  (
    db
      .prepare(`${select} ${where} ORDER BY n.created_at DESC`)
      .all(...params) as Row[]
  ).map(publicNetwork);

function checkText(value: unknown, max: number, code: string) {
  const text =
    typeof value === "string"
      ? value
          .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, " ")
          .replace(/\s+/g, " ")
          .trim()
      : "";
  if (!text || Array.from(text).length > max) throw new HttpError(400, code);
  return text;
}

function checkLnet(value: unknown) {
  if (typeof value !== "string" || value.includes("\0"))
    throw new HttpError(400, "bad-network");
  if (Buffer.byteLength(value) > 524_288) throw new HttpError(413, "too-large");
  if (!/^(version|format|lnet)\s*=/.test(value.trimStart()))
    throw new HttpError(400, "bad-network");
  return value;
}

const checkTypes = (value: unknown) =>
  typeIds
    .filter((type) => Array.isArray(value) && value.includes(type))
    .join(",");

export async function readDetails(context: Context, limit?: number) {
  const body = await context.body(limit);
  return {
    body,
    id: typeof body.id === "string" ? body.id : "",
    name: checkText(body.name, 80, "bad-name"),
    description: checkText(body.description, 300, "bad-description"),
  };
}

export const networkRoutes: Routes = {
  "GET /api/networks": ({ db, response }) =>
    send(response, 200, listNetworks(db, `WHERE ${active}`)),
  "GET /api/me/networks": (context) => {
    const userId = context.requireUser();
    send(
      context.response,
      200,
      listNetworks(context.db, "WHERE n.user_id = ?", userId),
    );
  },
  "GET /api/networks/file": (context) => {
    context.limit(`network-file:${context.ip}`, 300, 5 * 60_000);
    const id = new URL(context.request.url!, "http://local").searchParams.get(
      "id",
    );
    const row = context.db
      .prepare(
        `SELECT n.lnet FROM networks n JOIN users u ON u.id = n.user_id
        WHERE n.id = ? AND ${active}`,
      )
      .get(id) as { lnet: string } | undefined;
    if (!row) throw new HttpError(404, "not-found");
    // Content never changes per id
    context.response
      .writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      })
      .end(row.lnet);
  },
  "POST /api/networks": async (context) => {
    const { db } = context;
    const userId = context.requireUser();
    context.limit(`publish:${userId}`, 10, hour);
    const { body, name, description } = await readDetails(context, 1_048_576);
    const lnet = checkLnet(body.lnet);
    const { count } = db
      .prepare("SELECT count(*) AS count FROM networks WHERE user_id = ?")
      .get(userId) as { count: number };
    if (count >= perUser) throw new HttpError(409, "network-limit");
    const id = randomBytes(8).toString("base64url");
    db.prepare(
      "INSERT INTO networks (id, user_id, name, description, types, lnet, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      id,
      userId,
      name,
      description,
      checkTypes(body.types),
      lnet,
      Date.now(),
    );
    send(context.response, 201, findNetwork(db, id));
  },
  "PUT /api/networks": async (context) => {
    const { db } = context;
    const userId = context.requireUser();
    context.limit(`edit-network:${userId}`, 60, hour);
    const { id, name, description } = await readDetails(context);
    const { changes } = db
      .prepare(
        "UPDATE networks SET name = ?, description = ? WHERE id = ? AND user_id = ?",
      )
      .run(name, description, id, userId);
    if (!Number(changes)) throw new HttpError(404, "not-found");
    send(context.response, 200, findNetwork(db, id));
  },
  "DELETE /api/networks": async (context) => {
    const userId = context.requireUser();
    const { id } = await context.body();
    const { changes } = context.db
      .prepare("DELETE FROM networks WHERE id = ? AND user_id = ?")
      .run(typeof id === "string" ? id : "", userId);
    if (!Number(changes)) throw new HttpError(404, "not-found");
    send(context.response, 204);
  },
};
