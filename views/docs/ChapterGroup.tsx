type Chapter = { key: string; title: string };
type Props = { section: Chapter & { pages: Chapter[] }; route: string };
export default function ChapterGroup({ section, route }: Props) {
  return (
    <div className="chapter-group" key={section.key}>
      <a
        className="chapter-title"
        href={`#${section.key}`}
        aria-current={route === section.key ? "page" : undefined}
      >
        {section.title}
      </a>
      {section.pages.map((page: Chapter) => (
        <a
          className="chapter-sub"
          href={`#${page.key}`}
          key={page.key}
          aria-current={route === page.key ? "page" : undefined}
        >
          {page.title}
        </a>
      ))}
    </div>
  );
}
