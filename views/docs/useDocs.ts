import { useEffect, useState } from "react";
import {
  DEFAULT_BRANCH,
  FALLBACK_FILES,
  KNOWN_VERSIONS,
  buildNav,
  fetchBranches,
  fetchGuideTree,
} from "../../lib/docs-source";
import { useGuidePage } from "./useGuidePage";

export const readRoute = () => {
  try {
    const [key, anchor = ""] = decodeURIComponent(location.hash.slice(1)).split(
      "~",
    );
    return { key: key.trim(), anchor };
  } catch {
    return { key: "", anchor: "" };
  }
};

export function useDocs() {
  const [versions, setVersions] = useState<string[]>([]);
  const [branch, setBranch] = useState(() =>
    preferredBranch(KNOWN_VERSIONS, DEFAULT_BRANCH),
  );
  const [nav, setNav] = useState<ReturnType<typeof buildNav> | null>(() =>
    buildNav(FALLBACK_FILES),
  );
  const [route, setRoute] = useState(readRoute);
  const article = useGuidePage(nav, branch, route);
  useEffect(() => {
    fetchBranches().then((data) => {
      setVersions(data.versions);
      setBranch(preferredBranch(data.versions, data.default));
    });
    const change = () => setRoute(readRoute());
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    if (!branch) return;
    let live = true;
    fetchGuideTree(branch).then((files) => {
      if (live) setNav(buildNav(files));
    });
    return () => {
      live = false;
    };
  }, [branch]);
  const pickBranch = (value: string) => {
    try {
      localStorage.setItem("ln-docs-branch", value);
    } catch {
      /* Optional browser cache. */
    }
    setBranch(value);
  };
  return { versions, branch, nav, route, pickBranch, ...article };
}

function preferredBranch(versions: string[], fallback: string) {
  try {
    const saved = localStorage.getItem("ln-docs-branch") || "";
    return versions.includes(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}
