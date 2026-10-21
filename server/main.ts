import { createServer } from "node:http";
import { isAbsolute } from "node:path";
import { createApi } from "./api.ts";
import { readConfig } from "./config.ts";

const origin = process.env.ORIGIN || "";
if (!origin.startsWith("https://") || new URL(origin).origin !== origin)
  throw new Error(
    "Set ORIGIN to the site's https:// origin, with no path or trailing slash.",
  );
if (Buffer.from(process.env.SERVER_SECRET || "", "base64").length !== 32)
  throw new Error("Set SERVER_SECRET to 32 random bytes in base64.");
if (!isAbsolute(process.env.DB_PATH || ""))
  throw new Error("Set DB_PATH to an absolute path.");
if (!process.env.SMTP_URL)
  throw new Error("Set SMTP_URL so mail is sent instead of written to disk.");
if (!process.env.MAIL_FROM)
  throw new Error("Set MAIL_FROM to the sender address.");
if (process.env.TRUST_PROXY !== "1")
  throw new Error("Set TRUST_PROXY=1: the API runs behind Caddy.");
if (process.env.RATE_LIMITS === "off")
  throw new Error("Rate limits cannot be off in production.");
const api = createApi(readConfig());
createServer(async (request, response) => {
  const started = Date.now();
  await api(request, response);
  const path = (request.url || "").split("?")[0];
  console.log(
    `${request.method} ${path} ${response.statusCode} ${Date.now() - started}ms`,
  );
}).listen(Number(process.env.PORT || 8795), "127.0.0.1");
