import { createRoot } from "react-dom/client";
import DocsHeader from "./docs/DocsHeader";
import DocsFooter from "./docs/DocsFooter";
import DocsNavigation from "./docs/DocsNavigation";
import DocsArticle from "./docs/DocsArticle";
import DocsContents from "./docs/DocsContents";
import { useDocs } from "./docs/useDocs";
import { useDocsMenu } from "./docs/useDocsMenu";
import "../styles/views/docs/index.css";

function Docs() {
  const docs = useDocs();
  const menu = useDocsMenu(docs.route, docs.branch);
  return (
    <>
      <DocsHeader menuOpen={menu.open} onMenu={menu.toggle} />
      <main id="main" className="shell docs-layout" tabIndex={-1}>
        <DocsNavigation
          versions={docs.versions}
          branch={docs.branch}
          onBranch={docs.pickBranch}
          nav={docs.nav}
          route={docs.route.key}
          open={menu.open}
        />
        <DocsArticle
          status={docs.status}
          page={docs.page}
          branch={docs.branch}
          nav={docs.nav}
          route={docs.route.key}
          onRetry={docs.retry}
        />
        <DocsContents toc={docs.page?.toc || []} route={docs.route.key} />
      </main>
      <DocsFooter branch={docs.branch} />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Docs />);
