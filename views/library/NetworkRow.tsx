import { libraryFile, type NetworkEntry } from "../../lib/library";
import { resourceStyle, resources } from "../../lib/resources";
import Icon from "../../components/Icon";

export default function NetworkRow({ entry }: { entry: NetworkEntry }) {
  return (
    <article className="network-row">
      <div className="network-row-copy">
        <span className="network-author">By {entry.author}</span>
        <h2>{entry.name}</h2>
        <p>{entry.desc}</p>
      </div>
      <div className="network-row-meta">
        <ul>
          {entry.types.map((type) => (
            <li
              className="resource-label"
              key={type}
              style={resourceStyle(type)}
            >
              <span className="resource-dot" />
              {resources.find((resource) => resource.id === type)?.label ||
                type}
            </li>
          ))}
        </ul>
        {entry.added && <time dateTime={entry.added}>{entry.added}</time>}
      </div>
      <div className="network-row-actions">
        <a
          className="button secondary"
          href={`visualiser.html?net=${encodeURIComponent(entry.file)}`}
        >
          Open network <Icon name="arrow" size={18} />
        </a>
        <a className="network-download" href={libraryFile(entry.file)} download>
          Download .lnet <Icon name="download" size={16} />
        </a>
      </div>
    </article>
  );
}
