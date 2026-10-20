import { useRef } from "react";
import { type NetworkEntry } from "../../lib/library";
import LibraryStatus from "./LibraryStatus";
import LibraryEmpty from "./LibraryEmpty";
import LibraryCount from "./LibraryCount";
import LibraryPager from "./LibraryPager";
import NetworkGrid from "./NetworkGrid";

type Props = {
  entries: NetworkEntry[];
  count: number;
  total: number;
  status: string;
  page: number;
  pages: number;
  filtered: boolean;
  onPage: (page: number) => void;
  onRetry: () => void;
  onClear: () => void;
};

export default function LibraryResults({
  entries,
  count,
  total,
  status,
  page,
  pages,
  filtered,
  onPage,
  onRetry,
  onClear,
}: Props) {
  const top = useRef<HTMLDivElement>(null);
  if (status !== "ready")
    return <LibraryStatus status={status} onRetry={onRetry} />;
  const turn = (next: number) => {
    onPage(next);
    top.current?.focus({ preventScroll: true });
    top.current?.scrollIntoView();
  };
  return (
    <div className="library-results" ref={top} tabIndex={-1}>
      <LibraryCount
        count={count}
        total={total}
        page={page}
        pages={pages}
        filtered={filtered}
        onClear={onClear}
      />
      {entries.length ? (
        <NetworkGrid entries={entries} />
      ) : (
        <LibraryEmpty total={total} onClear={onClear} />
      )}
      {pages > 1 && <LibraryPager page={page} pages={pages} onPage={turn} />}
    </div>
  );
}
