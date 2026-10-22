import { createRoot } from "react-dom/client";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import PageIntro from "../components/PageIntro";
import LibraryToolbar from "./library/LibraryToolbar";
import LibraryNotice from "./library/LibraryNotice";
import LibraryResults from "./library/LibraryResults";
import { useLibraryFilters } from "./library/useLibraryFilters";
import { useLibrary, type NetworkEntry } from "../lib/library";
import { useNotice } from "../lib/useNotice";
import { links } from "../lib/resources";
import "../styles/index.css";
import "../styles/views/library.css";
// Reauth dialog and edit forms
import "../styles/views/account.css";

function Library() {
  const { entries, status, retry, change } = useLibrary(true);
  const filters = useLibraryFilters(entries);
  const notice = useNotice();
  const changed = (entry: NetworkEntry, next: NetworkEntry | null) => {
    change(entry, next);
    if (!next) notice.show(`Deleted ${entry.name}.`);
  };
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
        <LibraryNotice notice={notice} />
        <LibraryResults
          {...filters.results}
          total={entries.length}
          status={status}
          onRetry={retry}
          onChange={changed}
        />
      </main>
      <SiteFooter />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Library />);
