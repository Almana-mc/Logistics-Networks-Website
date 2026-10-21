import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import type { Context } from "./context.ts";
import { HttpError } from "./http.ts";
import { mails, sendMail } from "./mail.ts";
import { consume, peek, rewrite, type Purpose } from "./tokens.ts";
import { findUser } from "./users.ts";

export type CodeData = {
  userId: number;
  sessionHash?: string;
  codeMac?: string;
  tries: number;
  sends: number;
};

const mac = (key: Buffer, code: string) =>
  createHmac("sha256", key).update(code).digest();

export async function mailCode(
  context: Context,
  purpose: Purpose,
  token: string,
) {
  const data = peek<CodeData>(context.db, purpose, token);
  const user = data && findUser(context.db, data.userId);
  if (!data || !user) throw new HttpError(400, "code-expired");
  if (data.sends >= 3) throw new HttpError(429, "rate-limited");
  const code = randomInt(1_000_000).toString().padStart(6, "0");
  rewrite(context.db, purpose, token, {
    ...data,
    codeMac: mac(context.config.codeKey, code).toString("hex"),
    sends: data.sends + 1,
  });
  await sendMail(context.config, mails.code(user.email, code));
}

export function checkCode(
  context: Context,
  purpose: Purpose,
  token: unknown,
  code: unknown,
) {
  const data = peek<CodeData>(context.db, purpose, token);
  if (!data?.codeMac) throw new HttpError(400, "code-expired");
  const given = mac(
    context.config.codeKey,
    typeof code === "string" ? code.trim() : "",
  );
  if (timingSafeEqual(given, Buffer.from(data.codeMac, "hex"))) {
    if (!consume(context.db, purpose, token))
      throw new HttpError(400, "code-expired");
    return data;
  }
  if (data.tries + 1 >= 5) consume(context.db, purpose, token);
  else
    rewrite(context.db, purpose, token as string, {
      ...data,
      tries: data.tries + 1,
    });
  throw new HttpError(400, "wrong-code");
}
