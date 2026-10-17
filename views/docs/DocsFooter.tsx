import { links } from "../../lib/resources";
import { guideRepoUrl } from "../../lib/docs-source";

export default function DocsFooter({ branch }: { branch: string }) {
  return (
    <footer className="docs-footer">
      <div className="docs-footer__inner">
        <span className="docs-wordmark">
          Logistics <strong>Network</strong>
        </span>
        <nav aria-label="Footer">
          <a href="index.html">Home</a>
          <a href="library.html">Library</a>
          <a href="visualiser.html">Visualiser</a>
          <a href={guideRepoUrl(branch)} target="_blank" rel="noreferrer">
            Guide source
          </a>
          <a href={links.discord} target="_blank" rel="noreferrer">
            Discord
          </a>
        </nav>
        <p>
          Guides are served from the mod's in-game guide. Not an official
          Minecraft product. Not approved by or associated with Mojang or
          Microsoft.
        </p>
      </div>
    </footer>
  );
}
