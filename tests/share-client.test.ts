import { test } from "node:test";
import assert from "node:assert/strict";
import { createShare, expiryText, fetchShare, shareError } from "../lib/share";

const hour = 3_600_000;

test("share expiry reads as English relative time plus the local clock", () => {
  assert.match(expiryText(12 * hour, 0), /^expires in 12 hours \(.+\)$/);
  assert.match(expiryText(11.6 * hour, 0), /^expires in 12 hours \(/);
  assert.match(expiryText(60 * 60_000, 0), /^expires in 1 hour \(/);
  assert.match(expiryText(59 * 60_000, 0), /^expires in 59 minutes \(/);
  assert.match(expiryText(10, 0), /^expires in 1 minute \(/);
  assert.match(expiryText(0, 1), /^expired \(/);
});

test("share errors map API codes to sentences", () => {
  assert.equal(
    shareError(new Error("too-large"), "fallback"),
    "This network is too large to share (512 KB max).",
  );
  assert.equal(
    shareError(new Error("share-gone"), "fallback"),
    "This share link has expired or never existed. Links last 12 hours.",
  );
  assert.equal(shareError(new Error("constructor"), "fallback"), "fallback");
  assert.equal(
    shareError(new TypeError("Failed to fetch"), "fallback"),
    "fallback",
  );
  assert.equal(shareError("odd", "fallback"), "fallback");
});

test("share requests return JSON and throw API error codes", async (t) => {
  const real = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = real;
  });
  const reply = (status: number, body: string) => {
    globalThis.fetch = async () => new Response(body, { status });
  };
  reply(201, '{"id":"abcdefghijk","expiresAt":1}');
  assert.deepEqual(await createShare("a.lnet", "version=1"), {
    id: "abcdefghijk",
    expiresAt: 1,
  });
  reply(404, '{"error":"share-gone"}');
  await assert.rejects(fetchShare("abcdefghijk"), { message: "share-gone" });
  reply(502, "<html>Bad gateway</html>");
  await assert.rejects(fetchShare("abcdefghijk"), { message: "server" });
  reply(200, "<html>Portal</html>");
  await assert.rejects(fetchShare("abcdefghijk"), SyntaxError);
});
