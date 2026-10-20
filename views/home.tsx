import { createRoot } from "react-dom/client";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import HomeHero from "./home/HomeHero";
import DownloadSection from "./home/DownloadSection";
import SupportSection from "./home/SupportSection";
import { useRelease } from "../lib/release";
import "../styles/index.css";
import "../styles/views/home.css";
import "../styles/views/home-downloads.css";

function Home() {
  const version = useRelease().version.replace(/^v/, "");
  return (
    <>
      <SiteHeader current="Home" />
      <main id="main" tabIndex={-1}>
        <HomeHero version={version} />
        <DownloadSection version={version} />
        <SupportSection />
      </main>
      <SiteFooter />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Home />);
