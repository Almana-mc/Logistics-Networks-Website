import { adminNetworks } from "./admin-networks.ts";
import { adminChange } from "./audit.ts";
import { emailBlocked } from "./blocks.ts";
import type { Context, Routes } from "./context.ts";
import { HttpError, param, send } from "./http.ts";
import { mails, sendLater } from "./mail.ts";
import { dropTokens } from "./tokens.ts";
import {
  active,
  checkEmail,
  checkUsername,
  findUser,
  updateUser,
} from "./users.ts";

type Row = {
  id: number;
  username: string;
  email: string;
  created_at: number;
  suspended_at: number | null;
  networks: number;
  locked: number;
};

const rowSql = `SELECT u.id, u.username, u.email, u.created_at, u.suspended_at,
  (SELECT count(*) FROM networks n WHERE n.user_id = u.id) AS networks,
  NOT (${active}) AS locked
  FROM users u`;

const adminUser = (row: Row, adminIds: number[]) => ({
  id: row.id,
  username: row.username,
  email: row.email,
  createdAt: row.created_at,
  suspendedAt: row.suspended_at,
  networks: row.networks,
  locked: row.locked === 1,
  admin: adminIds.includes(row.id),
});

export function describeUser(context: Context, id: number) {
  const row = context.db.prepare(`${rowSql} WHERE u.id = ?`).get(id) as
    Row | undefined;
  if (!row) throw new HttpError(404, "not-found");
  return adminUser(row, context.config.adminIds);
}

export function targetUser(context: Context, id: unknown) {
  const user = typeof id === "number" ? findUser(context.db, id) : undefined;
  if (!user) throw new HttpError(404, "not-found");
  return user;
}

export const adminUserRoutes: Routes = {
  "GET /api/admin/users": (context) => {
    context.requireAdmin();
    const query = param(context.request, "q").trim().toLowerCase();
    const rows = context.db
      .prepare(
        `${rowSql} WHERE instr(lower(u.username), ?) OR instr(u.email, ?)
        ORDER BY u.created_at DESC LIMIT 50`,
      )
      .all(query, query) as Row[];
    send(
      context.response,
      200,
      rows.map((row) => adminUser(row, context.config.adminIds)),
    );
  },
  "GET /api/admin/user": (context) => {
    context.requireAdmin();
    const id = Number(param(context.request, "id"));
    send(context.response, 200, {
      ...describeUser(context, id),
      networkList: adminNetworks(context.db, "WHERE n.user_id = ?", id),
    });
  },
  "PUT /api/admin/user": async (context) => {
    const { db, config } = context;
    const log = adminChange(context);
    const body = await context.body();
    const user = targetUser(context, body.id);
    // Unchanged reserved names stay valid
    const sameName =
      body.username === undefined ||
      String(body.username).trim() === user.username;
    const username = sameName ? user.username : checkUsername(body.username);
    const email =
      body.email === undefined ? user.email : checkEmail(body.email);
    if (email !== user.email && emailBlocked(db, email))
      throw new HttpError(409, "email-blocked");
    updateUser(db, user.id, username, email);
    if (email !== user.email) dropTokens(db, "reset", user.id);
    if (username !== user.username)
      log("user.rename", `user:${user.id}`, {
        from: user.username,
        to: username,
      });
    if (email !== user.email)
      log("user.email", `user:${user.id}`, { from: user.email, to: email });
    if (username !== user.username)
      sendLater(config, mails.renamed(email, username));
    if (email !== user.email) {
      sendLater(config, mails.emailMoved(user.email));
      sendLater(config, mails.emailAdded(email, username));
    }
    send(context.response, 200, describeUser(context, user.id));
  },
};
