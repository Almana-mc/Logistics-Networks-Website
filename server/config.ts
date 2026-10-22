import { hkdfSync } from "node:crypto";

export type Config = {
  origin: string;
  dbPath: string;
  trustProxy: boolean;
  rateLimits: boolean;
  pepper: Buffer;
  codeKey: Buffer;
  smtpUrl: string;
  mailFrom: string;
  outbox: string;
  libraryDir: string;
  adminIds: number[];
  fetch: typeof fetch;
};

const derive = (secret: Buffer, info: string) =>
  Buffer.from(hkdfSync("sha256", secret, "", info, 32));

export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const secret = Buffer.from(env.SERVER_SECRET || "", "base64");
  return {
    origin: env.ORIGIN || `http://localhost:${env.PORT || 8794}`,
    dbPath: env.DB_PATH || ".data/app.db",
    trustProxy: env.TRUST_PROXY === "1",
    rateLimits: env.RATE_LIMITS !== "off",
    pepper: derive(secret, "password"),
    codeKey: derive(secret, "code"),
    smtpUrl: env.SMTP_URL || "",
    mailFrom: env.MAIL_FROM || "Logistics Network <accounts@localhost>",
    outbox: env.MAIL_OUTBOX || ".data/outbox",
    libraryDir: env.LIBRARY_DIR || "dist/library",
    adminIds: (env.ADMIN_IDS || "")
      .split(",")
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0),
    fetch: globalThis.fetch,
  };
}
