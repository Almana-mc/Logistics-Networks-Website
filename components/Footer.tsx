import logo from "../assets/logistic-icon-104.png";
import { links } from "../lib/resources";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-main">
        <a className="brand" href="index.html">
          <img src={logo} alt="" width="44" height="44" loading="lazy" />
          <span>
            Logistics <strong>Network</strong>
          </span>
        </a>
        <p>Built for your next Minecraft project.</p>
        <nav aria-label="Community">
          <a href={links.github} target="_blank" rel="noreferrer">
            Source on GitHub ↗
          </a>
          <a href={links.discord} target="_blank" rel="noreferrer">
            Join Discord ↗
          </a>
        </nav>
      </div>
      <div className="shell footer-bottom">
        <span>Java Edition · NeoForge</span>
        <span>Not affiliated with Mojang or Microsoft.</span>
      </div>
    </footer>
  );
}
