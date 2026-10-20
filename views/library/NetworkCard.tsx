import { libraryFile, type NetworkEntry } from "../../lib/library";
import { resourceStyle, resources } from "../../lib/resources";
import Icon from "../../components/Icon";
import NetworkThumb from "../../components/NetworkThumb";

export default function NetworkCard({ entry }: { entry: NetworkEntry }) {
  return (
    <article className="network-card">
      <NetworkThumb file={entry.file} />
      <h2>
        <a href={`visualiser.html?net=${encodeURIComponent(entry.file)}`}>
          {entry.name}
        </a>
      </h2>
      <p className="network-byline">
        <span>By {entry.author}</span>
        {entry.added && <time dateTime={entry.added}>{entry.added}</time>}
      </p>
      <p className="network-desc">{entry.desc}</p>
      <ul className="network-types">
        {entry.types.map((type) => (
          <li className="resource-label" key={type} style={resourceStyle(type)}>
            <span className="resource-dot" />
            {resources.find((resource) => resource.id === type)?.label || type}
          </li>
        ))}
      </ul>
      <div className="network-card-actions">
        <span className="network-open" aria-hidden="true">
          Open in visualiser <Icon name="arrow" size={16} />
        </span>
        <a
          className="button secondary"
          href={libraryFile(entry.file)}
          download
          aria-label={`Download ${entry.file}`}
          title="Download .lnet"
        >
          <Icon name="download" size={18} />
        </a>
      </div>
    </article>
  );
}
