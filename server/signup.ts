import { emailBlocked } from "./blocks.ts";
import type { Routes } from "./context.ts";
import { HttpError, send } from "./http.ts";
import { mails, sendMail, signInLink } from "./mail.ts";
import { checkPassword, hashPassword, verifyPassword } from "./passwords.ts";
import { consume, hashToken, issue, peek } from "./tokens.ts";
import {
  checkEmail,
  checkUsername,
  createUser,
  findUser,
  findUserByEmail,
  lockedOut,
  publicUser,
  usernameTaken,
} from "./users.ts";

type Pending = { username: string; email: string; passwordHash: string };
const quarter = 15 * 60_000;

export const signupRoutes: Routes = {
  "POST /api/signup": async (context) => {
    context.limit(`signup-scan:${context.ip}`, 30, quarter);
    const { db, config } = context;
    const body = await context.body();
    const username = checkUsername(body.username);
    const email = checkEmail(body.email);
    if (emailBlocked(db, email)) throw new HttpError(403, "email-blocked");
    if (usernameTaken(db, username)) throw new HttpError(409, "username-taken");
    context.limit(`signup-ip:${context.ip}`, 5, quarter);
    context.limit(`signup-email:${email}`, 3, quarter);
    const password = await checkPassword(config, body.password, username);
    const passwordHash = await hashPassword(password, config.pepper);
    const existing = findUserByEmail(db, email);
    if (existing) {
      if (!lockedOut(db, existing.id)) {
        const token = issue(db, "reset", { userId: existing.id });
        await sendMail(
          config,
          mails.existing(email, signInLink(config, "reset", token)),
        );
      }
    } else {
      const token = issue(db, "signup", { username, email, passwordHash });
      await sendMail(
        config,
        mails.signup(email, username, signInLink(config, "signup", token)),
      );
    }
    send(context.response, 202);
  },
  "POST /api/signup/verify": async (context) => {
    const { db, config } = context;
    context.limit(`verify-ip:${context.ip}`, 10, quarter);
    const body = await context.body();
    const pending = peek<Pending>(db, "signup", body.token);
    if (!pending) throw new HttpError(400, "link-expired");
    context.limit(`verify-token:${hashToken(String(body.token))}`, 5, quarter);
    const password = typeof body.password === "string" ? body.password : "";
    // Link alone must not sign in
    if (!(await verifyPassword(pending.passwordHash, password, config.pepper)))
      throw new HttpError(401, "signup-password");
    if (emailBlocked(db, pending.email))
      throw new HttpError(403, "email-blocked");
    if (!consume(db, "signup", body.token))
      throw new HttpError(400, "link-expired");
    const userId = createUser(
      db,
      pending.username,
      pending.email,
      pending.passwordHash,
    );
    context.signIn(userId);
    send(context.response, 200, { user: publicUser(findUser(db, userId)!) });
  },
};
