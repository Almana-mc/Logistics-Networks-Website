import { randomUUID } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import nodemailer from "nodemailer";
import type { Config } from "./config.ts";

export type Mail = { to: string; subject: string; text: string };

export async function sendMail(config: Config, mail: Mail) {
  if (config.smtpUrl) {
    await nodemailer
      .createTransport(config.smtpUrl)
      .sendMail({ from: config.mailFrom, ...mail });
    return;
  }
  await mkdir(config.outbox, { recursive: true });
  const file = join(config.outbox, `${Date.now()}-${randomUUID()}.json`);
  await writeFile(`${file}.tmp`, JSON.stringify(mail));
  await rename(`${file}.tmp`, file);
}

export function sendLater(config: Config, mail: Mail) {
  sendMail(config, mail).catch((error: { code?: string }) =>
    console.error(`Mail failed: ${error.code ?? "unknown"}`),
  );
}

export const signInLink = (config: Config, key: string, token: string) =>
  `${config.origin}/sign-in.html#${key}=${token}`;

const ignore = "If this wasn't you, you can ignore this email.";

export const mails = {
  signup: (to: string, username: string, link: string): Mail => ({
    to,
    subject: "Confirm your Logistics Network account",
    text: `Open this link and enter the password you chose at signup to finish creating the account "${username}":\n\n${link}\n\nIt works once and expires in 30 minutes. If you didn't sign up, ignore this email and no account is created.`,
  }),
  existing: (to: string, link: string): Mail => ({
    to,
    subject: "You already have a Logistics Network account",
    text: `Someone tried to create an account with this email, but you already have one.\n\nForgot your password? Choose a new one here:\n\n${link}\n\nThe link expires in 30 minutes. ${ignore}`,
  }),
  reset: (to: string, link: string): Mail => ({
    to,
    subject: "Reset your Logistics Network password",
    text: `Open this link to choose a new password:\n\n${link}\n\nIt works once and expires in 30 minutes. ${ignore}`,
  }),
  code: (to: string, code: string): Mail => ({
    to,
    subject: "Your Logistics Network code",
    text: `Your code is ${code}. It expires within 10 minutes.\n\nNever share this code. If you didn't ask for it, someone may know your password or be signed in as you: change your password and sign out your other devices.`,
  }),
  passwordChanged: (to: string): Mail => ({
    to,
    subject: "Your Logistics Network password changed",
    text: "Your password was just changed and your other devices were signed out.\n\nIf this wasn't you, reset your password now from the sign-in page.",
  }),
  passwordReset: (to: string): Mail => ({
    to,
    subject: "Your Logistics Network password was reset",
    text: "Your password was reset and every device was signed out.\n\nIf this wasn't you, reset your password again from the sign-in page.",
  }),
};
