import { useMemo, useState } from "react";
import { filterEntries, type NetworkEntry } from "../../lib/library";

const pageSize = 20;

const toggled = (types: string[], type: string) =>
  types.includes(type)
    ? types.filter((value) => value !== type)
    : [...types, type];

export function useLibraryFilters(entries: NetworkEntry[]) {
  const [filters, setFilters] = useState({
    query: "",
    types: [] as string[],
    sort: "new",
  });
  const [wanted, setPage] = useState(1);
  const filtered = useMemo(
    () => filterEntries(entries, filters.query, filters.types, filters.sort),
    [entries, filters],
  );
  const pages = Math.ceil(filtered.length / pageSize);
  const page = Math.min(wanted, Math.max(pages, 1));
  const update = (change: Partial<typeof filters>) => {
    setFilters({ ...filters, ...change });
    setPage(1);
  };
  return {
    toolbar: {
      ...filters,
      counts: (type: string) =>
        entries.filter((entry) => entry.types.includes(type)).length,
      onQuery: (query: string) => update({ query }),
      onSort: (sort: string) => update({ sort }),
      onType: (type: string) => update({ types: toggled(filters.types, type) }),
    },
    results: {
      entries: filtered.slice((page - 1) * pageSize, page * pageSize),
      count: filtered.length,
      page,
      pages,
      filtered: !!filters.query || filters.types.length > 0,
      onPage: setPage,
      onClear: () => update({ query: "", types: [] }),
    },
  };
}
