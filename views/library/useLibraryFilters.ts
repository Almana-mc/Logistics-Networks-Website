import { useMemo, useState } from "react";
import { filterEntries, type NetworkEntry } from "../../lib/library";

export function useLibraryFilters(entries: NetworkEntry[]) {
  const [filters, setFilters] = useState({
    query: "",
    types: [] as string[],
    sort: "new",
  });
  const [limit, setLimit] = useState(24);
  const filtered = useMemo(
    () => filterEntries(entries, filters.query, filters.types, filters.sort),
    [entries, filters],
  );
  const update = (change: Partial<typeof filters>) => {
    setFilters({ ...filters, ...change });
    setLimit(24);
  };
  return {
    toolbar: {
      ...filters,
      onQuery: (query: string) => update({ query }),
      onSort: (sort: string) => update({ sort }),
      onType: (type: string) =>
        update({
          types: filters.types.includes(type)
            ? filters.types.filter((value) => value !== type)
            : [...filters.types, type],
        }),
    },
    results: {
      entries: filtered,
      limit,
      filtered: !!filters.query || filters.types.length > 0,
      onMore: () => setLimit(limit + 24),
      onClear: () => update({ query: "", types: [] }),
    },
  };
}
