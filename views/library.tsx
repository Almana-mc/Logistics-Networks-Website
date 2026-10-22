import { createRoot } from "react-dom/client";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import PageIntro from "../components/PageIntro";
import LibraryToolbar from "./library/LibraryToolbar";
import LibraryResults from "./library/LibraryResults";
import { useLibraryFilters } from "./library/useLibraryFilters";
import { useLibrary } from "../lib/library";
import { links } from "../lib/resources";
import "../styles/index.css";
import "../styles/views/library.css";
// Reauth dialog and edit forms
import "../styles/views/account.css";

function Library() {
  const { entries, status, retry } = useLibrary(true);
  const filters = useLibraryFilters(entries);
  return (
    <>
      <SiteHeader current="Library" />
      <main id="main" className="shell page-main" tabIndex={-1}>
        <PageIntro eyebrow="Library" title="Saved networks">
          A starting point for your next build. Explore community setups,
          publish your own from the <a href="visualiser.html">visualiser</a>, or{" "}
          <a href={links.discord} target="_blank" rel="noreferrer">
            share them on Discord
          </a>
          .
        </PageIntro>
        <LibraryToolbar {...filters.toolbar} />
        <LibraryResults
          {...filters.results}
          total={entries.length}
          status={status}
          onRetry={retry}
        />
      </main>
      <SiteFooter />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Library />);
