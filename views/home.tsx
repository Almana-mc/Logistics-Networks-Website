import { createRoot } from "react-dom/client";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import HomeHero from "./home/HomeHero";
import DownloadSection from "./home/DownloadSection";
import CommunitySection from "./home/CommunitySection";
import SupportSection from "./home/SupportSection";
import { useRelease } from "../lib/release";
import { useLibrary } from "../lib/library";
import "../styles/index.css";
import "../styles/views/home.css";
import "../styles/views/home-downloads.css";
import "../styles/views/home-community.css";

function Home() {
  const version = useRelease().version.replace(/^v/, "");
  const library = useLibrary();
  return (
    <>
      <SiteHeader current="Home" />
      <main id="main" tabIndex={-1}>
        <HomeHero
          entry={library.entries[0]}
          ready={library.status !== "loading"}
        />
        <DownloadSection version={version} />
        {library.entries.length > 0 && (
          <CommunitySection entries={library.entries} />
        )}
        <SupportSection />
      </main>
      <SiteFooter />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Home />);
