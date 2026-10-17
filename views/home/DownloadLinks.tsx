import { links } from "../../lib/resources";
import Icon from "../../components/Icon";
export default function DownloadLinks() {
  return (
    <div className="download-links">
      <a href={links.curseforge} target="_blank" rel="noreferrer">
        <span>
          Download on<strong>CurseForge</strong>
        </span>
        <Icon name="external" size={30} />
      </a>
      <a href={links.modrinth} target="_blank" rel="noreferrer">
        <span>
          Download on<strong>Modrinth</strong>
        </span>
        <Icon name="external" size={30} />
      </a>
    </div>
  );
}
