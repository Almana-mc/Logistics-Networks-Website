import { createRoot } from "react-dom/client";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DocsNavigation from "./docs/DocsNavigation";
import DocsArticle from "./docs/DocsArticle";
import DocsContents from "./docs/DocsContents";
import { useDocs } from "./docs/useDocs";
import "../styles/index.css";
import "../styles/views/docs.css";
import "../styles/views/docs-article.css";

function Docs() {
  const docs = useDocs();
  return (
    <>
      <Header current="Docs" />
      <main id="main" className="shell docs-layout" tabIndex={-1}>
        <DocsNavigation
          versions={docs.versions}
          branch={docs.branch}
          onBranch={docs.pickBranch}
          nav={docs.nav}
          route={docs.route.key}
        />
        <div className="docs-reading">
          <div className="docs-contents-slot">
            <DocsContents toc={docs.page?.toc || []} />
          </div>
          <DocsArticle
            status={docs.status}
            page={docs.page}
            branch={docs.branch}
            onRetry={docs.retry}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Docs />);
