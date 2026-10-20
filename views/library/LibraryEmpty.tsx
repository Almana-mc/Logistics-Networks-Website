import { links } from "../../lib/resources";
type Props = { total: number; onClear: () => void };
export default function LibraryEmpty({ total, onClear }: Props) {
  return (
    <div className="empty-state">
      <h2>
        {total
          ? "No saved network matches yet"
          : "The library is waiting for its first network"}
      </h2>
      <p>
        {total
          ? "Nobody has shared a setup like this so far. Clear the filters to see every network, or share yours so the next player finds it."
          : "Share a .lnet setup with the community on Discord."}
      </p>
      <div className="actions">
        {total > 0 && (
          <button className="button secondary" onClick={onClear}>
            Clear filters
          </button>
        )}
        <a
          className="button primary"
          href={links.discord}
          target="_blank"
          rel="noreferrer"
        >
          Share a network
        </a>
      </div>
    </div>
  );
}
