import type { DatabaseSync } from "node:sqlite";
import type { Routes } from "./context.ts";
import { HttpError, send } from "./http.ts";
import { mails, sendLater } from "./mail.ts";
import { checkPassword, hashPassword } from "./passwords.ts";
import { dropTokens, endOtherSessions, sessionAlive } from "./tokens.ts";
import { findUser, publicUser, setPassword } from "./users.ts";

const quarter = 15 * 60_000;

function describe(db: DatabaseSync, userId: number) {
  const user = findUser(db, userId)!;
  return { user: publicUser(user), hasPassword: user.password_hash !== null };
}

export const accountRoutes: Routes = {
  "GET /api/me": (context) => {
    const session = context.session();
    send(
      context.response,
      200,
      session ? describe(context.db, session.userId) : null,
    );
  },
  "PUT /api/me/password": async (context) => {
    const { db, config } = context;
    const userId = context.requireRecent();
    context.limit(`password:${userId}`, 5, quarter);
    const user = findUser(db, userId)!;
    const password = await checkPassword(
      config,
      (await context.body()).password,
      user.username,
    );
    const hash = await hashPassword(password, config.pepper);
    const current = context.session()!.hash;
    // Reset may land mid-change
    if (!sessionAlive(db, current)) throw new HttpError(401, "signed-out");
    setPassword(db, userId, hash);
    endOtherSessions(db, userId, current);
    dropTokens(db, "reset", userId);
    sendLater(config, mails.passwordChanged(user.email));
    send(context.response, 204);
  },
};
