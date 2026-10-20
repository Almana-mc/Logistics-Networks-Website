type Props = {
  count: number;
  total: number;
  page: number;
  pages: number;
  filtered: boolean;
  onClear: () => void;
};
export default function LibraryCount({
  count,
  total,
  page,
  pages,
  filtered,
  onClear,
}: Props) {
  return (
    <div className="library-count">
      <p role="status">
        {count} {count === 1 ? "network" : "networks"}
        {filtered
          ? ` matching your filters, ${total} in the library`
          : " to explore"}
        {pages > 1 && ` · page ${page} of ${pages}`}
      </p>
      {filtered && count > 0 && (
        <button className="button text-button" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}
