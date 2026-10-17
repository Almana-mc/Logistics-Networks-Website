export type NetworkEntry = {
  name: string;
  author: string;
  desc: string;
  file: string;
  types: string[];
  added: string;
};
const typeIds = ["ITEM", "FLUID", "ENERGY", "CHEMICAL", "SOURCE"];

export function libraryFile(file: string) {
  if (!/^[^/\\?#]+\.(lnet|txt)$/i.test(file) || file.includes(".."))
    throw new Error("Choose a .lnet or .txt network file from the library.");
  return `library/${encodeURIComponent(file)}`;
}

export function normalizeEntry(raw: unknown): NetworkEntry | null {
  if (typeof raw !== "object" || raw === null) return null;
  const entry = raw as Record<string, unknown>;
  if (
    !["name", "author", "desc", "file"].every(
      (key) => typeof entry[key] === "string" && entry[key].trim(),
    )
  )
    return null;
  const { name, author, desc, file } = entry as Record<string, string>;
  try {
    libraryFile(file);
  } catch {
    return null;
  }
  return {
    name,
    author,
    desc,
    file,
    types: Array.isArray(entry.types)
      ? entry.types.filter(
          (type): type is string =>
            typeof type === "string" && typeIds.includes(type),
        )
      : [],
    added: typeof entry.added === "string" ? entry.added : "",
  };
}

export async function fetchLibrary(signal?: AbortSignal) {
  const response = await fetch("library/index.json", {
    signal,
    cache: "no-cache",
  });
  if (!response.ok) throw new Error("Could not load the library.");
  const data: unknown = await response.json();
  if (!Array.isArray(data))
    throw new Error("Could not read the library index.");
  return data
    .map(normalizeEntry)
    .filter((entry): entry is NetworkEntry => entry !== null);
}

export function filterEntries(
  entries: NetworkEntry[],
  query: string,
  types: string[],
  sort: string,
) {
  const search = query.trim().toLowerCase();
  return entries
    .filter(
      (entry) =>
        `${entry.name} ${entry.author} ${entry.desc}`
          .toLowerCase()
          .includes(search) &&
        (!types.length || entry.types.some((type) => types.includes(type))),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : b.added.localeCompare(a.added),
    );
}
