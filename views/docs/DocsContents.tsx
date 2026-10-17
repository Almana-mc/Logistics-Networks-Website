import type { GuidePage } from "./useGuidePage";

export default function DocsContents({ toc }: { toc: GuidePage["toc"] }) {
  if (!toc.length) return null;
  const go = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ block: "start" });
    element?.setAttribute("tabindex", "-1");
    element?.focus({ preventScroll: true });
  };
  return (
    <details className="docs-contents">
      <summary>On this page</summary>
      <nav aria-label="On this page">
        {toc.map((entry, index) => (
          <button
            key={`${entry.id}-${index}`}
            className={`contents-level-${entry.level}`}
            onClick={() => go(entry.id)}
          >
            {entry.text}
          </button>
        ))}
      </nav>
    </details>
  );
}
