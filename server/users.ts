import { randomBytes } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { HttpError } from "./http.ts";

export type User = {
  id: number;
  username: string;
  email: string;
  password_hash: string | null;
  twofa: number;
  require_key: number;
  webauthn_id: Uint8Array;
  created_at: number;
  suspended_at: number | null;
};

const reserved = new Set([
  "admin",
  "administrator",
  "almanax",
  "almanax21",
  "moderator",
  "support",
  "system",
  "root",
  "api",
  "account",
]);
const emailPattern =
  /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;

export function checkUsername(value: unknown) {
  const name = typeof value === "string" ? value.trim() : "";
  if (!/^[A-Za-z0-9_-]{3,24}$/.test(name))
    throw new HttpError(400, "bad-username");
  if (reserved.has(name.toLowerCase()))
    throw new HttpError(409, "username-taken");
  return name;
}

export function checkEmail(value: unknown) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (email.length > 254 || !emailPattern.test(email))
    throw new HttpError(400, "bad-email");
  return email;
}

export const usernameTaken = (db: DatabaseSync, name: string) =>
  db.prepare("SELECT 1 FROM users WHERE username = ?").get(name) !== undefined;

export const findUser = (db: DatabaseSync, id: number) =>
  db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;

export const findUserByEmail = (db: DatabaseSync, email: string) =>
  db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    User | undefined;

export const findUserByLogin = (db: DatabaseSync, login: string) =>
  db
    .prepare("SELECT * FROM users WHERE username = ? OR email = ?")
    .get(login, login) as User | undefined;

export const active = `u.suspended_at IS NULL AND NOT EXISTS (
  SELECT 1 FROM blocked_emails b
  WHERE b.pattern IN (u.email, substr(u.email, instr(u.email, '@'))))`;

export const lockedOut = (db: DatabaseSync, userId: number) =>
  db
    .prepare(`SELECT 1 FROM users u WHERE u.id = ? AND ${active}`)
    .get(userId) === undefined;

export const publicUser = (user: User) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  createdAt: user.created_at,
});

function uniqueError(error: unknown) {
  const { errcode, message } = error as { errcode?: number; message: string };
  if (errcode === 2067 && message.endsWith("users.username"))
    return new HttpError(409, "username-taken");
  if (errcode === 2067 && message.endsWith("users.email"))
    return new HttpError(409, "email-taken");
  return error;
}

export function createUser(
  db: DatabaseSync,
  username: string,
  email: string,
  passwordHash: string | null,
) {
  try {
    const row = db
      .prepare(
        "INSERT INTO users (username, email, password_hash, webauthn_id, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id",
      )
      .get(username, email, passwordHash, randomBytes(32), Date.now()) as {
      id: number;
    };
    return row.id;
  } catch (error) {
    throw uniqueError(error);
  }
}

export function setPassword(
  db: DatabaseSync,
  userId: number,
  hash: string | null,
) {
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
    hash,
    userId,
  );
}

export const swapPassword = (
  db: DatabaseSync,
  userId: number,
  from: string,
  to: string,
) =>
  Number(
    db
      .prepare(
        "UPDATE users SET password_hash = ? WHERE id = ? AND password_hash = ?",
      )
      .run(to, userId, from).changes,
  ) > 0;

export function updateUser(
  db: DatabaseSync,
  userId: number,
  username: string,
  email: string,
) {
  try {
    db.prepare("UPDATE users SET username = ?, email = ? WHERE id = ?").run(
      username,
      email,
      userId,
    );
  } catch (error) {
    throw uniqueError(error);
  }
}
