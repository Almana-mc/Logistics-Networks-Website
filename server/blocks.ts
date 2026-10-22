import type { DatabaseSync } from "node:sqlite";
import { adminChange } from "./audit.ts";
import type { Context, Routes } from "./context.ts";
import { HttpError, send } from "./http.ts";
import { mails, sendLater } from "./mail.ts";
import { endAllSessions } from "./tokens.ts";
import { active, checkEmail } from "./users.ts";

type Match = { id: number; email: string };

const domainPattern = /^@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;
const matching = "(u.email = ? OR substr(u.email, instr(u.email, '@')) = ?)";

export function checkPattern(value: unknown) {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (text.startsWith("@")) {
    if (text.length > 254 || !domainPattern.test(text))
      throw new HttpError(400, "bad-pattern");
    return text;
  }
  try {
    return checkEmail(text);
  } catch {
    throw new HttpError(400, "bad-pattern");
  }
}

export const emailBlocked = (db: DatabaseSync, email: string) =>
  db
    .prepare("SELECT 1 FROM blocked_emails WHERE pattern IN (?, ?)")
    .get(email, email.slice(email.indexOf("@"))) !== undefined;

const activeMatches = (db: DatabaseSync, pattern: string) =>
  db
    .prepare(
      `SELECT u.id, u.email FROM users u WHERE ${matching} AND ${active}`,
    )
    .all(pattern, pattern) as Match[];

const listBlocks = (db: DatabaseSync) =>
  db
    .prepare(
      `SELECT b.pattern, b.created_at AS createdAt,
      (SELECT count(*) FROM users u
        WHERE u.email = b.pattern OR substr(u.email, instr(u.email, '@')) = b.pattern
      ) AS accounts
      FROM blocked_emails b ORDER BY b.created_at DESC`,
    )
    .all();

async function readPattern(context: Context) {
  return checkPattern((await context.body()).pattern);
}

export const blockRoutes: Routes = {
  "GET /api/admin/blocks": (context) => {
    context.requireAdmin();
    send(context.response, 200, listBlocks(context.db));
  },
  "POST /api/admin/blocks": async (context) => {
    const { db, config } = context;
    const log = adminChange(context);
    const pattern = await readPattern(context);
    const locking = activeMatches(db, pattern);
    if (locking.some((user) => config.adminIds.includes(user.id)))
      throw new HttpError(409, "admin-target");
    const { changes } = db
      .prepare(
        "INSERT OR IGNORE INTO blocked_emails (pattern, created_at) VALUES (?, ?)",
      )
      .run(pattern, Date.now());
    if (Number(changes)) {
      for (const user of locking) endAllSessions(db, user.id);
      log("block.add", `block:${pattern}`, { accounts: locking.length });
      for (const user of locking)
        sendLater(config, mails.suspended(user.email));
    }
    send(context.response, 201, listBlocks(db));
  },
  "DELETE /api/admin/blocks": async (context) => {
    const { db, config } = context;
    const log = adminChange(context);
    const pattern = await readPattern(context);
    const { changes } = db
      .prepare("DELETE FROM blocked_emails WHERE pattern = ?")
      .run(pattern);
    if (!Number(changes)) throw new HttpError(404, "not-found");
    log("block.remove", `block:${pattern}`, {});
    for (const user of activeMatches(db, pattern))
      sendLater(config, mails.restored(user.email));
    send(context.response, 200, listBlocks(db));
  },
};
