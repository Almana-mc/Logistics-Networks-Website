type Props = {
  count: number;
  total: number;
  filtered: boolean;
  onClear: () => void;
};
export default function LibraryCount({
  count,
  total,
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
      </p>
      {filtered && (
        <button className="button text-button" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}
