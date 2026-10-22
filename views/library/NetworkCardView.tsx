import type { ReactNode } from "react";
import { entryFile, entryLink, type NetworkEntry } from "../../lib/library";
import { resourceStyle, resources } from "../../lib/resources";
import Icon from "../../components/Icon";
import NetworkThumb from "../../components/NetworkThumb";

function typeList(types: string[]) {
  return (
    <ul className="network-types">
      {types.map((type) => (
        <li className="resource-label" key={type} style={resourceStyle(type)}>
          <span className="resource-dot" />
          {resources.find((resource) => resource.id === type)?.label || type}
        </li>
      ))}
    </ul>
  );
}

export default function NetworkCardView({
  entry,
  children,
}: {
  entry: NetworkEntry;
  children?: ReactNode;
}) {
  return (
    <article className="network-card">
      <NetworkThumb entry={entry} />
      <h2>
        <a href={entryLink(entry)}>{entry.name}</a>
      </h2>
      <p className="network-byline">
        <span>
          By {entry.author}
          {entry.id && <span className="network-community">community</span>}
        </span>
        {entry.added && <time dateTime={entry.added}>{entry.added}</time>}
      </p>
      <p className="network-desc">{entry.desc}</p>
      {typeList(entry.types)}
      <div className="network-card-actions">
        <span className="network-open" aria-hidden="true">
          Open in visualiser <Icon name="arrow" size={16} />
        </span>
        <a
          className="button secondary"
          href={entryFile(entry)}
          download={entry.file}
          aria-label={`Download ${entry.file}`}
          title="Download .lnet"
        >
          <Icon name="download" size={18} />
        </a>
      </div>
      {children}
    </article>
  );
}
