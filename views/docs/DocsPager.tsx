import { buildNav, flattenNav } from "../../lib/docs-source";

type Props = { nav: ReturnType<typeof buildNav>; route: string };
export default function DocsPager({ nav, route }: Props) {
  const pages = flattenNav(nav);
  const at = pages.findIndex((page) => page.key === route);
  const prev = pages[at - 1];
  const next = pages[at + 1];
  return (
    <nav className="doc-pager" aria-label="Previous and next pages">
      {prev && (
        <a href={`#${prev.key}`} rel="prev">
          <span className="doc-pager__label">
            <span aria-hidden="true">← </span>Previous
          </span>
          <span className="doc-pager__title">{prev.title}</span>
        </a>
      )}
      {next && (
        <a className="doc-pager__next" href={`#${next.key}`} rel="next">
          <span className="doc-pager__label">
            Next<span aria-hidden="true"> →</span>
          </span>
          <span className="doc-pager__title">{next.title}</span>
        </a>
      )}
    </nav>
  );
}
