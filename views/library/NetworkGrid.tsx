import { type NetworkEntry } from "../../lib/library";
import NetworkCard from "./NetworkCard";

type Props = {
  entries: NetworkEntry[];
  onChange: (entry: NetworkEntry, next: NetworkEntry | null) => void;
};

export default function NetworkGrid({ entries, onChange }: Props) {
  return (
    <div className="network-grid">
      {entries.map((entry) => (
        <NetworkCard
          key={entry.id || entry.file}
          entry={entry}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
