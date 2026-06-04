# Library — how to add a network

This folder holds the saved `.lnet` networks shown on **library.html**. Each
entry is a `.lnet` file plus one block of metadata in `index.json`. The page
reads `index.json` and lists every valid entry; visitors open any one straight
in the visualiser. No server, no upload form — entries are added by committing
to this folder.

## Steps

1. Drop the export into this folder, e.g. `library/base-sorter.lnet`.
   - Filename: lowercase, words joined by `-`, ending in `.lnet`.
   - No spaces or folders. The file must sit directly in `library/`.
2. Open `index.json` and add one object to the array. Put new entries **first**
   (the default sort is newest by `added`).
3. Commit and push. The page picks it up on the next load.

## Entry format

```json
{
  "name": "Base Sorter",
  "author": "AlmanaX",
  "desc": "Nine-channel item sort feeding a central store.",
  "file": "base-sorter.lnet",
  "types": ["ITEM"],
  "added": "2026-06-05"
}
```

| Field    | Required | Notes |
|----------|----------|-------|
| `name`   | yes      | Display title. |
| `author` | yes      | Who made it. Searchable. |
| `desc`   | yes      | One-line summary. Searchable. Long text is clamped on the tile. |
| `file`   | yes      | Filename inside this folder. No `/` or `\`. |
| `types`  | no       | Resource types in the network. Drives the colour tags and the type filter. |
| `added`  | no       | ISO date `YYYY-MM-DD`. Shown on the tile, used for the Newest sort. |

### Valid `types`

`ITEM`, `FLUID`, `ENERGY`, `CHEMICAL`, `SOURCE` (uppercase). List every type the
network moves, e.g. `["ITEM", "FLUID", "ENERGY"]`. Unknown values are ignored.

## Example: full `index.json` with two entries

```json
[
  {
    "name": "Main Base",
    "author": "AlmanaX",
    "desc": "Item, fluid and energy channels wired across four nodes.",
    "file": "main-base.lnet",
    "types": ["ITEM", "FLUID", "ENERGY"],
    "added": "2026-06-05"
  },
  {
    "name": "Fluid Buffer",
    "author": "AlmanaX",
    "desc": "A two-tank import/export pair holding fluid on channel zero.",
    "file": "fluid-buffer.lnet",
    "types": ["FLUID"],
    "added": "2026-05-30"
  }
]
```

## Rules and gotchas

- `index.json` must be a valid JSON array. A syntax error (trailing comma,
  missing bracket) makes the whole page show its error state, so check it.
- An entry missing `name`, `author`, `desc`, or `file` is skipped; the rest
  still show. One bad entry will not blank the gallery.
- An empty array (`[]`) is fine: the page shows the "submit on Discord" state.
- The `.lnet` file must parse in the visualiser. Test it by opening
  `visualiser.html` and dropping the file before you commit.
