import type { IncomingMessage, ServerResponse } from "node:http";
import type { Config } from "./config.ts";
import { createContext, type Routes } from "./context.ts";
import { openDb } from "./db.ts";
import { HttpError, checkRequest, createLimiter, send } from "./http.ts";
import { sweep } from "./tokens.ts";
import { accountRoutes } from "./account.ts";
import { loginRoutes } from "./login.ts";
import { networkRoutes } from "./networks.ts";
import { reauthRoutes } from "./reauth.ts";
import { signupRoutes } from "./signup.ts";

const routes: Routes = {
  ...accountRoutes,
  ...loginRoutes,
  ...networkRoutes,
  ...reauthRoutes,
  ...signupRoutes,
};

// Messages may contain emails
const frames = (error: unknown) =>
  String((error as Error).stack)
    .split("\n")
    .filter((line) => line.startsWith("    at "))
    .slice(0, 3)
    .join(" |");

export function createApi(config: Config) {
  const db = openDb(config.dbPath);
  const limiter = createLimiter(config.rateLimits);
  sweep(db);
  setInterval(() => {
    sweep(db);
    limiter.sweep();
  }, 3_600_000).unref();
  return async (request: IncomingMessage, response: ServerResponse) => {
    response.setHeader("Cache-Control", "no-store");
    try {
      const path = (request.url || "/").split("?")[0];
      const handler = routes[`${request.method} ${path}`];
      if (!handler) throw new HttpError(404, "not-found");
      checkRequest(request, config.origin);
      await handler(createContext({ request, response, db, config }, limiter));
    } catch (error) {
      const known = error instanceof HttpError;
      if (!known)
        console.error(`Unhandled ${(error as Error).name}:${frames(error)}`);
      if (!response.headersSent)
        send(response, known ? error.status : 500, {
          error: known ? error.message : "server",
        });
    }
  };
}
