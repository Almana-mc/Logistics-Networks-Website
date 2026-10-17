import { createRoot } from "react-dom/client";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PageIntro from "../components/PageIntro";
import LibraryToolbar from "./library/LibraryToolbar";
import LibraryResults from "./library/LibraryResults";
import { useLibraryFilters } from "./library/useLibraryFilters";
import { useLibrary } from "./library/useLibrary";
import { links } from "../lib/resources";
import "../styles/index.css";
import "../styles/views/library.css";

function Library() {
  const { entries, status, retry } = useLibrary();
  const filters = useLibraryFilters(entries);
  return (
    <>
      <Header current="Library" />
      <main id="main" className="shell page-main" tabIndex={-1}>
        <PageIntro title="Saved networks">
          A starting point for your next build. Explore community setups, or{" "}
          <a href={links.discord} target="_blank" rel="noreferrer">
            share your own on Discord
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
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Library />);
