import { libraryFile, type NetworkEntry } from "../../lib/library";
import { resourceStyle, resources } from "../../lib/resources";
import Icon from "../../components/Icon";

export default function NetworkCard({ entry }: { entry: NetworkEntry }) {
  return (
    <article className="network-card">
      <h2>{entry.name}</h2>
      <p className="network-byline">
        <span className="network-author">By {entry.author}</span>
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
        <a
          className="button primary"
          href={`visualiser.html?net=${encodeURIComponent(entry.file)}`}
        >
          Open network <Icon name="arrow" size={18} />
        </a>
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
