import type { ReactNode } from "react";
import Icon from "../../components/Icon";
import BrandIcon, { type Brand } from "./BrandIcon";
import MavenCard from "./MavenCard";
import { links } from "../../lib/resources";
import { splitVersion } from "../../lib/release";
import { KNOWN_VERSIONS } from "../../lib/docs-source";

type Card = {
  href: string;
  brand: Brand;
  meta: ReactNode;
  title: string;
  text: string;
  note?: string;
  cta: string;
  featured?: boolean;
};

function DownloadCard(card: Card) {
  const { href, brand, meta, title, text, note, cta, featured } = card;
  return (
    <a
      className={featured ? "download-card is-featured" : "download-card"}
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      <div className="card-top">
        <BrandIcon name={brand} />
        {meta}
      </div>
      <div className="card-body">
        <h3>{title}</h3>
        <span>{text}</span>
        {note && <span className="card-note">{note}</span>}
      </div>
      <div className="card-cta">
        {cta} <Icon name="external" size={16} />
      </div>
    </a>
  );
}

export default function DownloadCards({ version }: { version: string }) {
  const mod = splitVersion(version)?.mod || version;
  return (
    <div className="download-cards">
      <DownloadCard
        featured
        href={links.curseforge}
        brand="curseforge"
        meta={<span className="card-badge">Recommended</span>}
        title="CurseForge"
        text="Install with the CurseForge app or grab the jar directly. Every release lands here first."
        note={`Minecraft ${KNOWN_VERSIONS.join(" · ")}`}
        cta="Download"
      />
      <DownloadCard
        href={links.releases}
        brand="github"
        meta={mod && <span className="card-meta">v{mod}</span>}
        title="GitHub Releases"
        text="Release jars, changelogs and the full source code."
        cta="View releases"
      />
      <MavenCard />
    </div>
  );
}
