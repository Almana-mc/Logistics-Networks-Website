import Icon from "../../components/Icon";
import BrandIcon from "./BrandIcon";
import MavenCoords from "./MavenCoords";
import { links } from "../../lib/resources";

export default function MavenCard() {
  return (
    <div id="maven" className="download-card">
      <div className="card-top">
        <BrandIcon name="maven" />
        <span className="card-meta">snapshots</span>
      </div>
      <div className="card-body">
        <h3>Maven</h3>
        <span>Snapshot builds for addon and pack developers.</span>
      </div>
      <div className="card-actions">
        <MavenCoords />
        <a
          className="card-cta"
          href={links.maven}
          target="_blank"
          rel="noreferrer"
        >
          Browse repository <Icon name="external" size={16} />
        </a>
      </div>
    </div>
  );
}
