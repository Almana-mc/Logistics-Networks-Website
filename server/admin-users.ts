import { adminNetworks } from "./admin-networks.ts";
import { adminChange } from "./audit.ts";
import { emailBlocked } from "./blocks.ts";
import type { Context, Routes } from "./context.ts";
import { HttpError, param, send } from "./http.ts";
import { mails, sendLater } from "./mail.ts";
import { dropTokens, endAllSessions } from "./tokens.ts";
import {
  active,
  checkEmail,
  checkUsername,
  findUser,
  lockedOut,
  updateUser,
  type User,
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

function describeUser(context: Context, id: number) {
  const row = context.db.prepare(`${rowSql} WHERE u.id = ?`).get(id) as
    Row | undefined;
  if (!row) throw new HttpError(404, "not-found");
  return adminUser(row, context.config.adminIds);
}

function targetUser(context: Context, id: unknown) {
  const user = typeof id === "number" ? findUser(context.db, id) : undefined;
  if (!user) throw new HttpError(404, "not-found");
  return user;
}

function targetOther(context: Context, id: unknown): User {
  const user = targetUser(context, id);
  if (context.config.adminIds.includes(user.id))
    throw new HttpError(409, "admin-target");
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
    const moved = email !== user.email;
    if (moved && emailBlocked(db, email))
      throw new HttpError(409, "email-blocked");
    updateUser(db, user.id, username, email);
    const renamed = username !== user.username;
    if (moved) dropTokens(db, "reset", user.id);
    if (renamed)
      log("user.rename", `user:${user.id}`, {
        from: user.username,
        to: username,
      });
    if (moved)
      log("user.email", `user:${user.id}`, { from: user.email, to: email });
    if (renamed) sendLater(config, mails.renamed(email, username));
    if (moved) {
      sendLater(config, mails.emailMoved(user.email));
      sendLater(config, mails.emailAdded(email, username));
    }
    send(context.response, 200, describeUser(context, user.id));
  },
  "POST /api/admin/user/suspend": async (context) => {
    const { db, config } = context;
    const log = adminChange(context);
    const body = await context.body();
    const user = targetOther(context, body.id);
    const suspend = body.suspended === true;
    if (suspend !== (user.suspended_at !== null)) {
      db.prepare("UPDATE users SET suspended_at = ? WHERE id = ?").run(
        suspend ? Date.now() : null,
        user.id,
      );
      if (suspend) endAllSessions(db, user.id);
      log(suspend ? "user.suspend" : "user.lift", `user:${user.id}`, {});
      if (suspend) sendLater(config, mails.suspended(user.email));
      else if (!lockedOut(db, user.id))
        sendLater(config, mails.restored(user.email));
    }
    send(context.response, 200, describeUser(context, user.id));
  },
  "POST /api/admin/user/signout": async (context) => {
    const log = adminChange(context);
    const user = targetOther(context, (await context.body()).id);
    endAllSessions(context.db, user.id);
    log("user.signout", `user:${user.id}`, {});
    sendLater(context.config, mails.signedOut(user.email));
    send(context.response, 204);
  },
  "DELETE /api/admin/user": async (context) => {
    const { db, config } = context;
    const log = adminChange(context);
    const user = targetOther(context, (await context.body()).id);
    const { networks } = describeUser(context, user.id);
    db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
    // Ids can be reused
    dropTokens(db, "reset", user.id);
    dropTokens(db, "reauth", user.id);
    log("user.delete", `user:${user.id}`, {
      username: user.username,
      email: user.email,
      networks,
    });
    sendLater(config, mails.deleted(user.email, user.username));
    send(context.response, 204);
  },
};
