import { createHash, randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

const minute = 60_000;
const lifetimes = {
  signup: 30 * minute,
  reset: 30 * minute,
  reauth: 10 * minute,
};
export type Purpose = keyof typeof lifetimes;
export type Session = {
  userId: number;
  hash: string;
  authedAt: number;
  renewed: boolean;
};
export const sessionLife = 30 * 24 * 60 * minute;
export const reauthWindow = 10 * minute;

export const newToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export function issue(
  db: DatabaseSync,
  purpose: Purpose,
  data: unknown,
  now = Date.now(),
) {
  const token = newToken();
  db.prepare(
    "INSERT INTO tokens (token_hash, purpose, data, expires_at) VALUES (?, ?, ?, ?)",
  ).run(
    hashToken(token),
    purpose,
    JSON.stringify(data),
    now + lifetimes[purpose],
  );
  return token;
}

function take<T>(
  db: DatabaseSync,
  sql: string,
  purpose: Purpose,
  token: unknown,
  now: number,
) {
  if (typeof token !== "string") return null;
  const row = db.prepare(sql).get(hashToken(token), purpose, now) as
    { data: string } | undefined;
  return row ? (JSON.parse(row.data) as T) : null;
}

export const peek = <T>(
  db: DatabaseSync,
  purpose: Purpose,
  token: unknown,
  now = Date.now(),
) =>
  take<T>(
    db,
    "SELECT data FROM tokens WHERE token_hash = ? AND purpose = ? AND expires_at > ?",
    purpose,
    token,
    now,
  );

export const consume = <T>(
  db: DatabaseSync,
  purpose: Purpose,
  token: unknown,
  now = Date.now(),
) =>
  take<T>(
    db,
    "DELETE FROM tokens WHERE token_hash = ? AND purpose = ? AND expires_at > ? RETURNING data",
    purpose,
    token,
    now,
  );

export function rewrite(
  db: DatabaseSync,
  purpose: Purpose,
  token: string,
  data: unknown,
) {
  db.prepare(
    "UPDATE tokens SET data = ? WHERE token_hash = ? AND purpose = ?",
  ).run(JSON.stringify(data), hashToken(token), purpose);
}

export function startSession(
  db: DatabaseSync,
  userId: number,
  now = Date.now(),
) {
  const token = newToken();
  db.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at, authed_at) VALUES (?, ?, ?, ?)",
  ).run(hashToken(token), userId, now + sessionLife, now);
  return token;
}

export function readSession(
  db: DatabaseSync,
  token: string | undefined,
  now = Date.now(),
): Session | null {
  if (!token) return null;
  const hash = hashToken(token);
  const row = db
    .prepare(
      "SELECT user_id, expires_at, authed_at FROM sessions WHERE token_hash = ? AND expires_at > ?",
    )
    .get(hash, now) as
    { user_id: number; expires_at: number; authed_at: number } | undefined;
  if (!row) return null;
  const renewed = row.expires_at - now < sessionLife / 2;
  if (renewed)
    db.prepare("UPDATE sessions SET expires_at = ? WHERE token_hash = ?").run(
      now + sessionLife,
      hash,
    );
  return { userId: row.user_id, hash, authedAt: row.authed_at, renewed };
}

export function touchAuthed(db: DatabaseSync, hash: string, now = Date.now()) {
  db.prepare("UPDATE sessions SET authed_at = ? WHERE token_hash = ?").run(
    now,
    hash,
  );
}

export function endSession(db: DatabaseSync, token: string | undefined) {
  if (token)
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(
      hashToken(token),
    );
}

export function endAllSessions(db: DatabaseSync, userId: number) {
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export function endOtherSessions(
  db: DatabaseSync,
  userId: number,
  keepHash: string,
) {
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash != ?").run(
    userId,
    keepHash,
  );
}

export function sweep(db: DatabaseSync, now = Date.now()) {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
  db.prepare("DELETE FROM tokens WHERE expires_at <= ?").run(now);
}

export const sessionAlive = (db: DatabaseSync, hash: string) =>
  db.prepare("SELECT 1 FROM sessions WHERE token_hash = ?").get(hash) !==
  undefined;

export function dropTokens(db: DatabaseSync, purpose: Purpose, userId: number) {
  db.prepare(
    "DELETE FROM tokens WHERE purpose = ? AND json_extract(data, '$.userId') = ?",
  ).run(purpose, userId);
}
