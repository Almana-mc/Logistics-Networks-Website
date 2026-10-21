export type Share = { id: string; expiresAt: number };
export type SharedFile = { name: string; lnet: string; expiresAt: number };

export const shareLimit = 524_288;

export const shareMessages: Record<string, string> = {
  "rate-limited": "Too many requests from your network. Try again later.",
  "too-large": "This network is too large to share (512 KB max).",
  "shares-full": "Sharing is paused right now. Try again later.",
  "share-gone":
    "This share link has expired or never existed. Links last 12 hours.",
  "bad-share": "This file doesn't look like a .lnet export.",
};

export const shareError = (failure: unknown, fallback: string) =>
  failure instanceof Error && Object.hasOwn(shareMessages, failure.message)
    ? shareMessages[failure.message]
    : fallback;

async function call<T>(query: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/shares${query}`, init);
  if (response.ok) return response.json();
  const data: { error?: string } = await response.json().catch(() => ({}));
  throw new Error(data.error || "server");
}

export const createShare = (name: string, lnet: string) =>
  call<Share>("", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, lnet }),
  });

export const fetchShare = (id: string) =>
  call<SharedFile>(`?id=${encodeURIComponent(id)}`);

export const shareUrl = (id: string) => `${location.origin}/s/${id}`;

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const clock = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function expiryText(expiresAt: number, now = Date.now()) {
  if (expiresAt <= now) return `expired (${clock.format(expiresAt)})`;
  const minutes = Math.max(1, Math.round((expiresAt - now) / 60_000));
  const left =
    minutes < 60
      ? relative.format(minutes, "minute")
      : relative.format(Math.round(minutes / 60), "hour");
  return `expires ${left} (${clock.format(expiresAt)})`;
}
