import { type NetworkEntry } from "../../lib/library";
import NetworkCard from "./NetworkCard";

export default function NetworkGrid({ entries }: { entries: NetworkEntry[] }) {
  return (
    <div className="network-grid">
      {entries.map((entry) => (
        <NetworkCard key={entry.file} entry={entry} />
      ))}
    </div>
  );
}
