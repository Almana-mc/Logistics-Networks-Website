import type { IncomingMessage, ServerResponse } from "node:http";
import type { DatabaseSync } from "node:sqlite";
import type { Config } from "./config.ts";
import {
  HttpError,
  clientIp,
  readCookie,
  readJson,
  type Limiter,
} from "./http.ts";
import {
  endSession,
  readSession,
  reauthWindow,
  sessionLife,
  startSession,
  touchAuthed,
  type Session,
} from "./tokens.ts";

export type Context = {
  request: IncomingMessage;
  response: ServerResponse;
  db: DatabaseSync;
  config: Config;
  ip: string;
  body: (limit?: number) => Promise<Record<string, unknown>>;
  session: () => Session | null;
  requireUser: () => number;
  requireRecent: () => number;
  signIn: (userId: number) => void;
  signOut: () => void;
  markAuthed: () => void;
  limit: (key: string, max: number, span: number) => void;
};
export type Handler = (context: Context) => Promise<void> | void;
export type Routes = Record<string, Handler>;
type Base = Pick<Context, "request" | "response" | "db" | "config">;

function cookieJar({ response, config }: Base) {
  const secure = config.origin.startsWith("https:");
  const name = secure ? "__Host-session" : "session";
  const flags = `; Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
  return {
    name,
    write: (token: string, maxAge: number) =>
      response.appendHeader(
        "Set-Cookie",
        `${name}=${token}; Max-Age=${maxAge}${flags}`,
      ),
  };
}

function sessionCookie(base: Base) {
  const { request, db } = base;
  const jar = cookieJar(base);
  const sent = readCookie(request, jar.name);
  const life = sessionLife / 1000;
  let session: Session | null | undefined;
  return {
    session: () => {
      if (session === undefined) {
        session = readSession(db, sent);
        if (session?.renewed) jar.write(sent!, life);
      }
      return session;
    },
    signIn: (userId: number) => {
      endSession(db, sent);
      const token = startSession(db, userId);
      jar.write(token, life);
      session = readSession(db, token);
    },
    signOut: () => {
      endSession(db, sent);
      jar.write("", 0);
      session = null;
    },
  };
}

export function createContext(base: Base, limiter: Limiter): Context {
  const cookie = sessionCookie(base);
  const requireUser = () => {
    const session = cookie.session();
    if (!session) throw new HttpError(401, "signed-out");
    return session.userId;
  };
  return {
    ...base,
    ...cookie,
    ip: clientIp(base.request, base.config.trustProxy),
    body: (limit) => readJson(base.request, limit),
    requireUser,
    requireRecent: () => {
      const userId = requireUser();
      if (Date.now() - cookie.session()!.authedAt > reauthWindow)
        throw new HttpError(403, "reauth");
      return userId;
    },
    markAuthed: () => touchAuthed(base.db, cookie.session()!.hash),
    limit: (key, max, span) => limiter.hit(key, max, span),
  };
}
