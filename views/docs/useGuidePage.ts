import { useEffect, useRef, useState, type ReactNode } from "react";
import { buildNav, pathForKey, rawUrl } from "../../lib/docs-source";
import { parseMarkdown } from "../../lib/docs-markdown";

export type GuidePage = {
  title: string | null;
  blocks: ReactNode[];
  path: string;
  toc: { id: string; text: string; level: number }[];
};

function showAnchor(anchor: string) {
  const element = document.getElementById(anchor);
  if (element) {
    element.scrollIntoView({ block: "start" });
    element.setAttribute("tabindex", "-1");
    element.focus({ preventScroll: true });
  }
}

export function useGuidePage(
  nav: ReturnType<typeof buildNav> | null,
  branch: string,
  route: { key: string; anchor: string },
) {
  const [page, setPage] = useState<GuidePage | null>(null);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const cache = useRef(new Map<string, string>());
  useEffect(() => {
    setStatus("loading");
    setPage(null);
    if (!nav || !branch) return;
    const path = pathForKey(nav, route.key);
    if (!path) {
      setStatus("notfound");
      return;
    }
    const abort = new AbortController();
    const key = `${branch}:${path}`;
    const request = readGuide(cache.current, key, path, branch, abort.signal);
    request
      .then((text) => {
        if (abort.signal.aborted) return;
        cache.current.set(key, text);
        const next = { ...parseMarkdown(text, path, branch), path };
        setPage(next);
        setStatus("ready");
        updateMetadata(next.title, branch);
      })
      .catch(() => {
        if (!abort.signal.aborted) setStatus("error");
      });
    return () => abort.abort();
  }, [nav, branch, route.key, attempt]);
  useEffect(() => {
    if (page && route.anchor) showAnchor(route.anchor);
  }, [page, route.anchor]);
  return { page, status, retry: () => setAttempt(attempt + 1) };
}

function readGuide(
  cache: Map<string, string>,
  key: string,
  path: string,
  branch: string,
  signal: AbortSignal,
) {
  return cache.has(key)
    ? Promise.resolve(cache.get(key)!)
    : fetch(rawUrl(path, branch), { signal }).then((response) => {
        if (!response.ok) throw new Error("Guide unavailable");
        return response.text();
      });
}
function updateMetadata(title: string | null, branch: string) {
  document.title = `${title || "Documentation"} | Logistics Network`;
  document
    .querySelector('meta[name="description"]')!
    .setAttribute(
      "content",
      `${title || "Documentation"}: the Logistics Network guide for Minecraft ${branch}.`,
    );
}
