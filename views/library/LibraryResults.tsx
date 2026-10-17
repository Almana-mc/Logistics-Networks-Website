import { type NetworkEntry } from "../../lib/library";
import LibraryStatus from "./LibraryStatus";
import LibraryEmpty from "./LibraryEmpty";
import LibraryCount from "./LibraryCount";
import NetworkRow from "./NetworkRow";

type Props = {
  entries: NetworkEntry[];
  total: number;
  status: string;
  limit: number;
  filtered: boolean;
  onMore: () => void;
  onRetry: () => void;
  onClear: () => void;
};

export default function LibraryResults({
  entries,
  total,
  status,
  limit,
  filtered,
  onMore,
  onRetry,
  onClear,
}: Props) {
  if (status !== "ready")
    return <LibraryStatus status={status} onRetry={onRetry} />;
  return (
    <>
      <LibraryCount
        count={entries.length}
        total={total}
        filtered={filtered}
        onClear={onClear}
      />
      {entries.length ? (
        <div className="network-list">
          {entries.slice(0, limit).map((entry) => (
            <NetworkRow key={entry.file} entry={entry} />
          ))}
        </div>
      ) : (
        <LibraryEmpty total={total} onClear={onClear} />
      )}
      {entries.length > limit && (
        <div className="load-more">
          <button className="button secondary" onClick={onMore}>
            Load more networks
          </button>
        </div>
      )}
    </>
  );
}
