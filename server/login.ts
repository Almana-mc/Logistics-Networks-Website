import type { Routes } from "./context.ts";
import { HttpError, send } from "./http.ts";
import { mails, sendLater, signInLink } from "./mail.ts";
import {
  checkPassword,
  hashPassword,
  needsRehash,
  passwordMatches,
} from "./passwords.ts";
import { consume, dropTokens, endAllSessions, issue, peek } from "./tokens.ts";
import {
  checkEmail,
  findUser,
  findUserByEmail,
  findUserByLogin,
  lockedOut,
  publicUser,
  setPassword,
  swapPassword,
} from "./users.ts";

const minute = 60_000;
const quarter = 15 * minute;

export const loginRoutes: Routes = {
  "POST /api/login": async (context) => {
    const { db, config } = context;
    context.limit(`login-ip:${context.ip}`, 20, 5 * minute);
    const body = await context.body();
    const login =
      typeof body.login === "string" ? body.login.trim().slice(0, 254) : "";
    const password = typeof body.password === "string" ? body.password : "";
    context.limit(`login:${login.toLowerCase()}`, 10, quarter);
    const user = login ? findUserByLogin(db, login) : undefined;
    const matches = await passwordMatches(
      user?.password_hash,
      password,
      config.pepper,
    );
    if (!user || !matches) throw new HttpError(401, "invalid-login");
    let hash = user.password_hash!;
    if (needsRehash(hash)) {
      const next = await hashPassword(password, config.pepper);
      if (swapPassword(db, user.id, hash, next)) hash = next;
    }
    // Reset may land mid-login
    if (findUser(db, user.id)?.password_hash !== hash)
      throw new HttpError(401, "invalid-login");
    if (lockedOut(db, user.id)) throw new HttpError(403, "account-suspended");
    context.signIn(user.id);
    send(context.response, 200, { user: publicUser(user) });
  },
  "POST /api/logout": (context) => {
    context.signOut();
    send(context.response, 204);
  },
  "POST /api/reset": async (context) => {
    const { db, config } = context;
    context.limit(`reset-ip:${context.ip}`, 5, quarter);
    const email = checkEmail((await context.body()).email);
    context.limit(`reset-email:${email}`, 3, quarter);
    // Answer before any lookup
    send(context.response, 202);
    const user = findUserByEmail(db, email);
    const token = issue(db, "reset", { userId: user?.id ?? 0 });
    if (user && !lockedOut(db, user.id))
      sendLater(config, mails.reset(email, signInLink(config, "reset", token)));
  },
  "POST /api/reset/complete": async (context) => {
    const { db, config } = context;
    context.limit(`reset-done:${context.ip}`, 10, quarter);
    const body = await context.body();
    const pending = peek<{ userId: number }>(db, "reset", body.token);
    const user = pending && findUser(db, pending.userId);
    if (!user) throw new HttpError(400, "link-expired");
    if (lockedOut(db, user.id)) throw new HttpError(403, "account-suspended");
    const password = await checkPassword(config, body.password, user.username);
    if (!consume(db, "reset", body.token))
      throw new HttpError(400, "link-expired");
    setPassword(db, user.id, await hashPassword(password, config.pepper));
    dropTokens(db, "reset", user.id);
    endAllSessions(db, user.id);
    sendLater(config, mails.passwordReset(user.email));
    send(context.response, 204);
  },
};
