import type { DatabaseSync } from "node:sqlite";
import { adminChange } from "./audit.ts";
import type { Routes } from "./context.ts";
import { HttpError, send } from "./http.ts";
import { mails, sendLater } from "./mail.ts";
import { publicNetwork, readDetails, type Row } from "./networks.ts";
import { active } from "./users.ts";

type AdminRow = Row & { user_id: number; email: string; hidden: number };

const adminSelect = `SELECT n.id, n.name, n.description, n.types, n.created_at,
  n.user_id, u.username AS author, u.email, NOT (${active}) AS hidden
  FROM networks n JOIN users u ON u.id = n.user_id`;

const adminNetwork = (row: AdminRow) => ({
  ...publicNetwork(row),
  userId: row.user_id,
  hidden: row.hidden === 1,
});

const findRow = (db: DatabaseSync, id: unknown) =>
  typeof id === "string"
    ? (db.prepare(`${adminSelect} WHERE n.id = ?`).get(id) as
        AdminRow | undefined)
    : undefined;

// ponytail: no paging yet
export const adminNetworks = (
  db: DatabaseSync,
  where = "",
  ...params: number[]
) =>
  (
    db
      .prepare(`${adminSelect} ${where} ORDER BY n.created_at DESC`)
      .all(...params) as AdminRow[]
  ).map(adminNetwork);

export const adminNetworkRoutes: Routes = {
  "GET /api/admin/networks": (context) => {
    context.requireAdmin();
    send(context.response, 200, adminNetworks(context.db));
  },
  "PUT /api/admin/networks": async (context) => {
    const { db, config } = context;
    const log = adminChange(context);
    const { id, name, description } = await readDetails(context);
    const before = findRow(db, id);
    if (!before) throw new HttpError(404, "not-found");
    db.prepare(
      "UPDATE networks SET name = ?, description = ? WHERE id = ?",
    ).run(name, description, id);
    log("network.edit", `network:${id}`, {
      from: { name: before.name, description: before.description },
      to: { name, description },
    });
    sendLater(config, mails.networkEdited(before.email, before.name));
    send(context.response, 200, adminNetwork(findRow(db, id)!));
  },
  "DELETE /api/admin/networks": async (context) => {
    const { db, config } = context;
    const log = adminChange(context);
    const before = findRow(db, (await context.body()).id);
    if (!before) throw new HttpError(404, "not-found");
    db.prepare("DELETE FROM networks WHERE id = ?").run(before.id);
    log("network.delete", `network:${before.id}`, {
      name: before.name,
      author: before.author,
    });
    sendLater(config, mails.networkDeleted(before.email, before.name));
    send(context.response, 204);
  },
};
