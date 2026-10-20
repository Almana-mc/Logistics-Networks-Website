import { useEffect, useState } from "react";
import { links } from "./resources";
import { readStored, writeStored } from "./storage";
import { afterFirstPaint } from "./first-paint";

type Release = { version: string; released: string; url: string };
type Cache = { at: number; data: Release };
const latest =
  "https://api.github.com/repos/Almana-mc/LogisticsNetworks/releases/latest";
const fallback = {
  version: "",
  released: "",
  url: `${links.github}/releases/latest`,
};

export function splitVersion(tag: string) {
  const match = tag.replace(/^v/, "").match(/^(\d+\.\d+(?:\.\d+)?)-(.+)$/);
  return match ? { minecraft: match[1], mod: match[2] } : null;
}

export function useRelease() {
  const [release, setRelease] = useState<Release>(fallback);
  useEffect(() => {
    const cached = readStored<Cache>("ln-release");
    if (
      typeof cached?.data?.version === "string" &&
      typeof cached.data.url === "string" &&
      cached.data.url.startsWith(`${links.github}/releases/`)
    ) {
      setRelease(cached.data);
      if (Date.now() - cached.at < 3600000) return;
    }
    const abort = new AbortController();
    afterFirstPaint()
      .then(() => fetch(latest, { signal: abort.signal }))
      .then((response) => {
        if (!response.ok) throw new Error("Release unavailable");
        return response.json();
      })
      .then((data) => {
        if (typeof data.tag_name !== "string") return;
        const date = new Date(data.published_at);
        const next = {
          version: data.tag_name,
          released: Number.isNaN(date.getTime())
            ? ""
            : date.toLocaleDateString("en", { dateStyle: "medium" }),
          url: fallback.url,
        };
        setRelease(next);
        writeStored("ln-release", { at: Date.now(), data: next });
      })
      .catch(() => {});
    return () => abort.abort();
  }, []);
  return release;
}
