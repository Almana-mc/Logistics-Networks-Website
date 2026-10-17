import GuideUnavailable from "./GuideUnavailable";
import { blobUrl } from "../../lib/docs-source";
import type { GuidePage } from "./useGuidePage";
import Icon from "../../components/Icon";

type Props = {
  page: GuidePage | null;
  status: string;
  branch: string;
  onRetry: () => void;
};

export default function DocsArticle({ page, status, branch, onRetry }: Props) {
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
        Logistics Network guide <span> / {branch}</span>
      </p>
      {page.blocks}
      <a
        className="doc-source inline-link"
        href={blobUrl(page.path, branch)}
        target="_blank"
        rel="noreferrer"
      >
        View this guide on GitHub <Icon name="external" size={18} />
      </a>
    </article>
  );
}
