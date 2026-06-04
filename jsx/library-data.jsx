/* library-data.jsx — saved-networks data layer (fetch, validate, handoff) */

const LIBRARY_DIR = 'library/';
const TYPE_IDS = RESOURCE_TYPES.map(t => t.id);

const libraryFileUrl = file => LIBRARY_DIR + file;

function normalizeEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const str = v => (typeof v === 'string' ? v.trim() : '');
  const name = str(raw.name);
  const author = str(raw.author);
  const desc = str(raw.desc);
  const file = str(raw.file).replace(/[\\/]/g, '');
  if (!name || !author || !desc || !file) return null;
  const types = Array.isArray(raw.types) ? raw.types.filter(t => TYPE_IDS.includes(t)) : [];
  const added = typeof raw.added === 'string' ? raw.added : null;
  return { name, author, desc, file, types, added, _url: libraryFileUrl(file) };
}

let cache = null;

function fetchLibrary() {
  if (cache) return Promise.resolve(cache);
  return fetch(LIBRARY_DIR + 'index.json')
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(data => {
      const list = Array.isArray(data) ? data : [];
      cache = list.map(normalizeEntry).filter(Boolean);
      return cache;
    });
}

function openInVisualiser(entry) {
  return fetch(entry._url)
    .then(r => (r.ok ? r.text() : Promise.reject(r.status)))
    .then(text => {
      writeHandoff(entry.file, text);
      location.href = 'visualiser.html';
    });
}

function matchesQuery(entry, q) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return entry.name.toLowerCase().includes(s)
    || entry.author.toLowerCase().includes(s)
    || entry.desc.toLowerCase().includes(s);
}

function matchesTypes(entry, active) {
  if (!active || active.size === 0) return true;
  return entry.types.some(t => active.has(t));
}

// Tile footprint from content weight, keeps masonry from going uniform.
function entrySpan(entry) {
  if (entry.types.length >= 3 || entry.desc.length > 150) return 'lg';
  if (entry.desc.length < 72) return 'sm';
  return 'md';
}

function sortEntries(list, mode) {
  const out = list.slice();
  if (mode === 'name') {
    out.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    out.sort((a, b) => (b.added || '').localeCompare(a.added || ''));
  }
  return out;
}

Object.assign(window, {
  LIBRARY_DIR, fetchLibrary, libraryFileUrl, openInVisualiser,
  matchesQuery, matchesTypes, entrySpan, sortEntries,
});
