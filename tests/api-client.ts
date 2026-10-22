import { createServer } from "node:http";
import type { TestContext } from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createApi } from "../server/api.ts";
import { readConfig, type Config } from "../server/config.ts";
import { openDb } from "../server/db.ts";

export const origin = "http://localhost:8794";
export const password = "correct horse battery staple";
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- JSON test replies
type Reply = { status: number; headers: Headers; body: any };
type Mail = { to: string; subject: string; text: string };

const clean = (async () => new Response("")) as unknown as typeof fetch;

export async function startApi(overrides: Partial<Config> = {}) {
  const dir = await mkdtemp(join(tmpdir(), "lnet-api-"));
  const config: Config = {
    ...readConfig({}),
    origin,
    dbPath: join(dir, "app.db"),
    outbox: join(dir, "outbox"),
    libraryDir: "library",
    rateLimits: false,
    fetch: clean,
    ...overrides,
  };
  const server = createServer(createApi(config)).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const db = openDb(config.dbPath);
  return {
    base,
    client: () => createClient(base),
    mail: (to: string) => takeMail(config.outbox, to),
    sql: (query: string, ...params: string[]) =>
      db.prepare(query).run(...params),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test rows
    row: (query: string) => db.prepare(query).get() as any,
    close: () => {
      server.closeAllConnections();
      server.close();
      db.close();
    },
  };
}
export type Api = Awaited<ReturnType<typeof startApi>>;

function createClient(base: string) {
  const jar = new Map<string, string>();
  return {
    async call(
      method: string,
      path: string,
      body?: unknown,
      headers: Record<string, string> = {},
    ): Promise<Reply> {
      const response = await fetch(base + path, {
        method,
        redirect: "manual",
        headers: {
          Origin: origin,
          "Content-Type": "application/json",
          Cookie: [...jar]
            .map(([name, value]) => `${name}=${value}`)
            .join("; "),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      for (const line of response.headers.getSetCookie()) {
        const [name, value] = line.split(";")[0].split("=");
        if (value) jar.set(name, value);
        else jar.delete(name);
      }
      const text = await response.text();
      return {
        status: response.status,
        headers: response.headers,
        body: text ? JSON.parse(text) : undefined,
      };
    },
  };
}
export type Client = ReturnType<typeof createClient>;

async function takeMail(outbox: string, to: string): Promise<Mail> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const files = await readdir(outbox).catch(() => [] as string[]);
    for (const file of files.filter((name) => name.endsWith(".json")).sort()) {
      const mail = JSON.parse(
        await readFile(join(outbox, file), "utf8"),
      ) as Mail;
      if (mail.to !== to) continue;
      await rm(join(outbox, file));
      return mail;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`No mail for ${to}`);
}

export const tokenIn = (text: string, key: string) =>
  text.match(new RegExp(`#${key}=(\\S+)`))![1];
export const codeIn = (text: string) => text.match(/\b(\d{6})\b/)![1];

export const confirm = (client: Client, token: string) =>
  client.call("POST", "/api/signup/verify", { token, password });

export async function signUp(
  api: Api,
  client: Client,
  username: string,
  email: string,
) {
  await client.call("POST", "/api/signup", { username, email, password });
  const token = tokenIn((await api.mail(email)).text, "signup");
  return confirm(client, token);
}

export const sampleNetwork = {
  name: "Bee Automation",
  description: "A simple Productive Bees setup",
  lnet: await readFile("library/bee-automation.lnet", "utf8"),
  types: ["ITEM"],
};

export async function startAdmin(t: TestContext) {
  const api = await startApi({ adminIds: [1] });
  t.after(api.close);
  const admin = api.client();
  await signUp(api, admin, "Boss", "boss@example.com");
  const user = api.client();
  await signUp(api, user, "Member", "member@example.com");
  return { api, admin, user };
}
