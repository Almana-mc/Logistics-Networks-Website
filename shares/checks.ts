import { HttpError } from "./http.ts";

const maxBytes = 524_288;

export function checkLnet(value: unknown) {
  if (typeof value !== "string" || value.includes("\0"))
    throw new HttpError(400, "bad-share");
  const size = Buffer.byteLength(value);
  if (size > maxBytes) throw new HttpError(413, "too-large");
  if (!/^(version|format|lnet)\s*=/.test(value.trimStart()))
    throw new HttpError(400, "bad-share");
  return size;
}

export function cleanName(value: unknown) {
  if (typeof value !== "string") throw new HttpError(400, "bad-share");
  const name = value
    .split(/[/\\]/)
    .at(-1)!
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, "")
    .trim();
  const stem = Array.from(name.replace(/\.lnet$/i, ""))
    .slice(0, 95)
    .join("");
  return `${stem || "network"}.lnet`;
}
