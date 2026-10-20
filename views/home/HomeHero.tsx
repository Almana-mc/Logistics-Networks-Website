import Icon from "../../components/Icon";
import HeroGraph from "./HeroGraph";
import { links } from "../../lib/resources";
import VersionPill from "./VersionPill";
import type { NetworkEntry } from "../../lib/library";

type Props = { version: string; entry?: NetworkEntry; ready: boolean };
export default function HomeHero({ version, entry, ready }: Props) {
  return (
    <section className="shell home-hero" aria-labelledby="home-title">
      <div className="hero-copy">
        <div className="hero-meta">
          <p className="eyebrow">Minecraft mod</p>
          <VersionPill version={version} />
        </div>
        <h1 id="home-title" className="hero-title">
          <span>Logistics</span> <span>Network</span>
        </h1>
        <p className="hero-lead">
          Slap a node on any chest, tank or machine, pick what moves, and it
          moves. Items, fluids, energy, chemicals and Source. No pipes, no
          cables, no clutter in your base.
        </p>
        <div className="actions">
          <a
            className="button primary hero-cta"
            href={links.curseforge}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="download" size={18} />
            Download on CurseForge
          </a>
          <a className="button secondary hero-cta" href="#download">
            All downloads
          </a>
        </div>
      </div>
      <HeroGraph entry={entry} ready={ready} />
    </section>
  );
}
