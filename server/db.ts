import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

const migrations = [
  `CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT,
    twofa INTEGER NOT NULL DEFAULT 0,
    require_key INTEGER NOT NULL DEFAULT 0,
    webauthn_id BLOB NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE avatars (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    webp BLOB NOT NULL,
    hash TEXT NOT NULL
  );
  CREATE TABLE passkeys (
    credential_id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_key BLOB NOT NULL,
    counter INTEGER NOT NULL,
    transports TEXT NOT NULL,
    uv INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_used_at INTEGER
  );
  CREATE INDEX passkeys_user ON passkeys (user_id);
  CREATE TABLE identities (
    provider TEXT NOT NULL,
    subject TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (provider, subject)
  );
  CREATE INDEX identities_user ON identities (user_id);
  CREATE TABLE recovery_codes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    PRIMARY KEY (user_id, code_hash)
  );
  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    authed_at INTEGER NOT NULL
  );
  CREATE INDEX sessions_user ON sessions (user_id);
  CREATE TABLE tokens (
    token_hash TEXT PRIMARY KEY,
    purpose TEXT NOT NULL,
    data TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );`,
  `CREATE TABLE networks (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    types TEXT NOT NULL,
    lnet TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX networks_user ON networks (user_id);
  CREATE INDEX networks_created ON networks (created_at);`,
  `ALTER TABLE users ADD COLUMN suspended_at INTEGER;
  CREATE TABLE blocked_emails (
    pattern TEXT PRIMARY KEY COLLATE NOCASE,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE admin_log (
    id INTEGER PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );`,
];

export function openDb(path: string) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  const { user_version: version } = db.prepare("PRAGMA user_version").get() as {
    user_version: number;
  };
  migrations
    .slice(version)
    .forEach((sql, index) =>
      db.exec(
        `BEGIN; ${sql} PRAGMA user_version = ${version + index + 1}; COMMIT;`,
      ),
    );
  return db;
}
