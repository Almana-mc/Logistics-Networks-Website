import ResourceFilters from "./ResourceFilters";

type Props = {
  query: string;
  onQuery: (value: string) => void;
  types: string[];
  counts: (type: string) => number;
  onType: (type: string) => void;
  sort: string;
  onSort: (value: string) => void;
};

export default function LibraryToolbar({
  query,
  onQuery,
  types,
  counts,
  onType,
  sort,
  onSort,
}: Props) {
  return (
    <div className="library-toolbar">
      <div className="library-search">
        <label htmlFor="network-search">Find a network</label>
        <input
          id="network-search"
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Try “bees” or “Pilpoh”"
        />
      </div>
      <div className="library-sort">
        <label htmlFor="network-sort">Sort by</label>
        <select
          id="network-sort"
          value={sort}
          onChange={(event) => onSort(event.target.value)}
        >
          <option value="new">Newest first</option>
          <option value="name">Name, A to Z</option>
        </select>
      </div>
      <ResourceFilters types={types} counts={counts} onType={onType} />
    </div>
  );
}
