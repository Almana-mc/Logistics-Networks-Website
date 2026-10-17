import ChapterGroup from "./ChapterGroup";
import { buildNav } from "../../lib/docs-source";

type Props = { nav: ReturnType<typeof buildNav> | null; route: string };
type Chapter = { key: string; title: string };

export default function ChapterLinks({ nav, route }: Props) {
  if (!nav)
    return (
      <p role="status" className="docs-loading">
        Loading chapters…
      </p>
    );
  return (
    <nav className="chapter-links" aria-label="Documentation chapters">
      {nav.overview && (
        <a href="#" aria-current={!route ? "page" : undefined}>
          Overview
        </a>
      )}
      {nav.sections.map((section) => (
        <ChapterGroup key={section.key} section={section} route={route} />
      ))}
      {nav.extras.map((page: Chapter) => (
        <a
          key={page.key}
          href={`#${page.key}`}
          aria-current={route === page.key ? "page" : undefined}
        >
          {page.title}
        </a>
      ))}
    </nav>
  );
}
