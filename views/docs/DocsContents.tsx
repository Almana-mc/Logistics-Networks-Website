import { useEffect, useState } from "react";
import type { GuidePage } from "./useGuidePage";

type Props = { toc: GuidePage["toc"]; route: string };
export default function DocsContents({ toc, route }: Props) {
  const active = useActiveHeading(toc);
  if (!toc.length) return null;
  return (
    <nav className="docs-toc" aria-label="On this page">
      <p className="docs-label">On this page</p>
      <div className="docs-toc__links">
        {toc.map((entry, index) => (
          <a
            key={`${entry.id}-${index}`}
            className={`toc-level-${entry.level}`}
            href={`#${route}~${entry.id}`}
            aria-current={entry.id === active ? "location" : undefined}
          >
            {entry.text}
          </a>
        ))}
      </div>
    </nav>
  );
}

function useActiveHeading(toc: GuidePage["toc"]) {
  const [active, setActive] = useState("");
  useEffect(() => {
    const spy = () => {
      const line = window.innerHeight * 0.4;
      const passed = toc.filter(
        (entry) =>
          document.getElementById(entry.id)!.getBoundingClientRect().top < line,
      );
      setActive((passed.at(-1) ?? toc[0])?.id ?? "");
    };
    spy();
    window.addEventListener("scroll", spy, { passive: true });
    return () => window.removeEventListener("scroll", spy);
  }, [toc]);
  return active;
}
