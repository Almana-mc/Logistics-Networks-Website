import { useEffect, useState } from "react";
import { readStored, writeStored } from "./storage";
import { afterFirstPaint } from "./first-paint";

const sources = [
  "https://api.cfwidget.com/minecraft/mc-mods/logistics-network",
  "https://almanax21.com/api/downloads",
];
const fallback = 1200000;
type Status = "loading" | "live" | "cached" | "fallback";
type Payload = {
  downloads?: { total?: unknown };
  projects?: Record<string, { raw?: unknown } | undefined>;
};

export function readCount(data: unknown) {
  const value = (data || {}) as Payload;
  const count =
    value.downloads?.total ?? value.projects?.["logistics-network"]?.raw;
  return typeof count === "number" && count > 0 ? count : null;
}

function initial(): { value: number; status: Status } {
  const cached = readStored<{ n?: unknown }>("ln-downloads");
  const value = readCount({ downloads: { total: cached?.n } });
  return value ? { value, status: "cached" } : { value: 0, status: "loading" };
}

export function useDownloadCount() {
  const [count, setCount] = useState(initial);
  useEffect(() => {
    const abort = new AbortController();
    const get = (url: string) =>
      fetch(url, { signal: abort.signal })
        .then((response) => (response.ok ? response.json() : null))
        .then(readCount)
        .catch(() => null);
    afterFirstPaint()
      .then(() => get(sources[0]))
      .then((value) => value ?? get(sources[1]))
      .then((value) => {
        if (abort.signal.aborted) return;
        if (!value)
          return setCount((current) =>
            current.value ? current : { value: fallback, status: "fallback" },
          );
        writeStored("ln-downloads", { n: value, at: Date.now() });
        setCount({ value, status: "live" });
      });
    return () => abort.abort();
  }, []);
  return count;
}
