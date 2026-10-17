import GuideUnavailable from "./GuideUnavailable";
import DocsPager from "./DocsPager";
import { blobUrl, buildNav, sectionForKey } from "../../lib/docs-source";
import type { GuidePage } from "./useGuidePage";
import Icon from "../../components/Icon";

type Props = {
  page: GuidePage | null;
  status: string;
  branch: string;
  nav: ReturnType<typeof buildNav> | null;
  route: string;
  onRetry: () => void;
};

export default function DocsArticle(props: Props) {
  const { page, status, branch, nav, route, onRetry } = props;
  if (status === "loading")
    return (
      <article className="doc-article">
        <h1>Documentation</h1>
        <div className="loading-state" role="status">
          <p>Loading the guide…</p>
        </div>
      </article>
    );
  if (status !== "ready" || !page)
    return (
      <GuideUnavailable status={status} branch={branch} onRetry={onRetry} />
    );
  return (
    <article className="doc-article">
      <p className="doc-context">
        <Icon name="book" size={14} />
        {sectionForKey(nav, route)?.title || "Guide"}
      </p>
      {page.blocks}
      <div className="doc-footer">
        <a
          className="doc-source"
          href={blobUrl(page.path, branch)}
          target="_blank"
          rel="noreferrer"
        >
          View this page on GitHub <Icon name="external" size={14} />
        </a>
        <DocsPager nav={nav!} route={route} />
      </div>
    </article>
  );
}
