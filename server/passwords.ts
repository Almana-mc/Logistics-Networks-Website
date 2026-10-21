import { argon2, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Config } from "./config.ts";
import { HttpError } from "./http.ts";

type Params = { memory: number; passes: number; parallelism: number };
export const current: Params = { memory: 65_536, passes: 3, parallelism: 4 };

const unpadded = (bytes: Buffer) => bytes.toString("base64").replace(/=+$/, "");
const prefix = ({ memory, passes, parallelism }: Params) =>
  `$argon2id$v=19$m=${memory},t=${passes},p=${parallelism}$`;

function derive(
  password: string,
  salt: Buffer,
  params: Params,
  pepper: Buffer,
) {
  return new Promise<Buffer>((resolve, reject) =>
    argon2(
      "argon2id",
      {
        message: password.normalize("NFKC"),
        nonce: salt,
        secret: pepper,
        tagLength: 32,
        ...params,
      },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
}

export async function hashPassword(
  password: string,
  pepper: Buffer,
  params = current,
) {
  const salt = randomBytes(16);
  const hash = await derive(password, salt, params, pepper);
  return `${prefix(params)}${unpadded(salt)}$${unpadded(hash)}`;
}

export async function verifyPassword(
  phc: string,
  password: string,
  pepper: Buffer,
) {
  const [, , , settings, salt, hash] = phc.split("$");
  const [memory, passes, parallelism] = settings
    .split(",")
    .map((pair) => Number(pair.slice(2)));
  const actual = await derive(
    password,
    Buffer.from(salt, "base64"),
    { memory, passes, parallelism },
    pepper,
  );
  return timingSafeEqual(actual, Buffer.from(hash, "base64"));
}

export const needsRehash = (phc: string) => !phc.startsWith(prefix(current));

let dummy: Promise<string> | undefined;

// Equal timing for unknown users
export async function passwordMatches(
  phc: string | null | undefined,
  password: string,
  pepper: Buffer,
) {
  dummy ??= hashPassword(randomBytes(16).toString("hex"), pepper).catch(
    (error) => {
      dummy = undefined;
      throw error;
    },
  );
  const matches = await verifyPassword(phc || (await dummy), password, pepper);
  return Boolean(phc) && matches;
}

export async function checkPassword(
  config: Config,
  value: unknown,
  username: string,
) {
  const password = typeof value === "string" ? value.normalize("NFKC") : "";
  const length = [...password].length;
  if (length < 12 || length > 128) throw new HttpError(400, "password-length");
  if (password.toLowerCase().includes(username.toLowerCase()))
    throw new HttpError(400, "password-username");
  if (await breached(config.fetch, password))
    throw new HttpError(400, "password-breached");
  return password;
}

async function breached(fetcher: typeof fetch, password: string) {
  const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
  try {
    const response = await fetcher(
      `https://api.pwnedpasswords.com/range/${sha1.slice(0, 5)}`,
      {
        headers: {
          "Add-Padding": "true",
          "User-Agent": "logistics-network-accounts",
        },
        signal: AbortSignal.timeout(3000),
      },
    );
    if (!response.ok) throw new Error(`HIBP ${response.status}`);
    return (await response.text()).split("\n").some((line) => {
      const [suffix, count] = line.trim().split(":");
      return suffix === sha1.slice(5) && Number(count) > 0;
    });
  } catch {
    console.warn("Breached-password check skipped: HIBP unreachable");
    return false;
  }
}
