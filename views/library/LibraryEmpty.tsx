import { links } from "../../lib/resources";
type Props = { total: number; onClear: () => void };
export default function LibraryEmpty({ total, onClear }: Props) {
  return (
    <div className="empty-state">
      <h2>
        {total
          ? "No matching networks"
          : "The library is waiting for its first network"}
      </h2>
      <p>
        {total
          ? "Try another search or clear the resource filters."
          : "Share a .lnet setup with the community on Discord."}
      </p>
      {total ? (
        <button className="button primary" onClick={onClear}>
          Clear filters
        </button>
      ) : (
        <a
          className="button primary"
          href={links.discord}
          target="_blank"
          rel="noreferrer"
        >
          Share a network
        </a>
      )}
    </div>
  );
}
