import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

type Saved = {
  id: string;
  name: string;
  lnet: string;
  size: number;
  expiresAt: number;
};
type Found = { name: string; lnet: string; expires_at: number };

// ponytail: no migrations yet
export function openStore(path: string) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      lnet TEXT NOT NULL,
      size INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS shares_expiry ON shares (expires_at, size);`);
  return db;
}

export const storedBytes = (db: DatabaseSync, now: number) =>
  (
    db
      .prepare("SELECT total(size) AS bytes FROM shares WHERE expires_at > ?")
      .get(now) as { bytes: number }
  ).bytes;

export function saveShare(db: DatabaseSync, share: Saved) {
  db.prepare(
    "INSERT INTO shares (id, name, lnet, size, expires_at) VALUES (?, ?, ?, ?, ?)",
  ).run(share.id, share.name, share.lnet, share.size, share.expiresAt);
}

export const findShare = (db: DatabaseSync, id: string, now: number) =>
  db
    .prepare(
      "SELECT name, lnet, expires_at FROM shares WHERE id = ? AND expires_at > ?",
    )
    .get(id, now) as Found | undefined;

export function sweep(db: DatabaseSync, now = Date.now()) {
  db.prepare("DELETE FROM shares WHERE expires_at <= ?").run(now);
}
