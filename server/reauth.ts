import { checkCode, mailCode, type CodeData } from "./codes.ts";
import type { Routes } from "./context.ts";
import { HttpError, send } from "./http.ts";
import { passwordMatches } from "./passwords.ts";
import { issue, peek } from "./tokens.ts";
import { findUser } from "./users.ts";

const minute = 60_000;
const quarter = 15 * minute;

export const reauthRoutes: Routes = {
  "POST /api/reauth/password": async (context) => {
    const userId = context.requireUser();
    context.limit(`reauth-ip:${context.ip}`, 20, 5 * minute);
    context.limit(`reauth:${userId}`, 5, quarter);
    const { password } = await context.body();
    const user = findUser(context.db, userId)!;
    const matches = await passwordMatches(
      user.password_hash,
      typeof password === "string" ? password : "",
      context.config.pepper,
    );
    if (!matches) throw new HttpError(401, "wrong-password");
    context.markAuthed();
    send(context.response, 204);
  },
  "POST /api/reauth/email": async (context) => {
    const userId = context.requireUser();
    context.limit(`reauth-ip:${context.ip}`, 20, 5 * minute);
    context.limit(`reauth-mail:${userId}`, 3, quarter);
    const data: CodeData = {
      userId,
      sessionHash: context.session()!.hash,
      tries: 0,
      sends: 0,
    };
    const token = issue(context.db, "reauth", data);
    await mailCode(context, "reauth", token);
    send(context.response, 200, { token });
  },
  "POST /api/reauth/code": async (context) => {
    context.requireUser();
    context.limit(`reauth-ip:${context.ip}`, 20, 5 * minute);
    const body = await context.body();
    const pending = peek<CodeData>(context.db, "reauth", body.token);
    if (pending?.sessionHash !== context.session()!.hash)
      throw new HttpError(400, "code-expired");
    checkCode(context, "reauth", body.token, body.code);
    context.markAuthed();
    send(context.response, 204);
  },
};
