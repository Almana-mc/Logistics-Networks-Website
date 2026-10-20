import NetworkThumb from "../../components/NetworkThumb";
import type { NetworkEntry } from "../../lib/library";

export default function CommunitySetups({
  entries,
}: {
  entries: NetworkEntry[];
}) {
  return (
    <ul className="community-setups">
      {entries.slice(0, 3).map((entry) => (
        <li key={entry.file}>
          <a href={`visualiser.html?net=${encodeURIComponent(entry.file)}`}>
            <NetworkThumb file={entry.file} />
            <strong>{entry.name}</strong>
            <span>By {entry.author}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
