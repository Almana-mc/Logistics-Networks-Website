import HostingPartner from "./HostingPartner";
import { useRelease } from "../../lib/release";
import DownloadLinks from "./DownloadLinks";
import Icon from "../../components/Icon";

export default function Downloads() {
  const release = useRelease();
  return (
    <section
      className="downloads shell"
      id="download"
      aria-labelledby="download-title"
    >
      <div className="download-copy">
        <h2 id="download-title">Make the connection.</h2>
        <p>
          Add Logistics Network to your next Minecraft build. Choose your
          platform and the release that matches your game.
        </p>
        <a
          className="release-link"
          href={release.url}
          target="_blank"
          rel="noreferrer"
        >
          {release.version
            ? `Latest release: ${release.version}`
            : "View the latest release"}{" "}
          <Icon name="external" size={16} />
        </a>
        {release.released && (
          <p className="release-date">Released {release.released}</p>
        )}
      </div>
      <DownloadLinks />
      <HostingPartner />
    </section>
  );
}
