import { createRoot } from "react-dom/client";
import Header from "../components/Header";
import Footer from "../components/Footer";
import HomeHero from "./home/HomeHero";
import HomeNetwork from "./home/HomeNetwork";
import HomeTools from "./home/HomeTools";
import Downloads from "./home/Downloads";
import "../styles/index.css";
import "../styles/views/home.css";
import "../styles/views/home-sections.css";

function Home() {
  return (
    <>
      <Header current="Home" />
      <main id="main" tabIndex={-1}>
        <HomeHero />
        <HomeNetwork />
        <HomeTools />
        <Downloads />
      </main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Home />);
