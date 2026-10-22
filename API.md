# Library API

Read-only endpoints for looking up networks in the library, for bots and other tools. They need no account, no cookies and no API key.

- Base URL: `https://logistics-network.almanax21.com`
- Every endpoint is `GET`. Responses are JSON unless stated otherwise.
- Errors are JSON `{ "error": "<code>" }` with the matching HTTP status (see [Errors](#errors)).
- The library holds two kinds of network:
  - **curated**: picked by the maintainers, listed in `library/index.json`. Their ids are file names ending in `.lnet`, for example `bee-automation.lnet`.
  - **community**: published by account holders from the visualiser. Their ids are 11 URL-safe characters, for example `pQ3kZ8wLx0A`.

URL-encode ids and query values.

## Network object

Search results and network details share these fields:

| Field         | Type                         | Notes                                                                       |
| ------------- | ---------------------------- | --------------------------------------------------------------------------- |
| `id`          | string                       | Stable lookup key.                                                          |
| `source`      | `"curated"` \| `"community"` |                                                                             |
| `name`        | string                       | Up to 80 characters.                                                        |
| `description` | string                       | Up to 300 characters.                                                       |
| `author`      | string                       | Account username for community networks.                                    |
| `types`       | string[]                     | Resources moved: `ITEM`, `FLUID`, `ENERGY`, `CHEMICAL`, `SOURCE`.           |
| `createdAt`   | number                       | Milliseconds since the Unix epoch. Curated networks use their `added` date. |
| `links`       | object                       | Absolute URLs, below.                                                       |

`links`:

| Field        | Opens                                                    |
| ------------ | -------------------------------------------------------- |
| `visualiser` | The network in the website's visualiser.                 |
| `file`       | The raw `.lnet` file (`text/plain`), for import in game. |
| `image`      | A PNG picture of the network graph.                      |

## Search

```
GET /api/library/search
```

| Parameter | Default  | Meaning                                                                                                                                                     |
| --------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `q`       | none     | Words to find in the name, author or description. Case-insensitive. Every word must match somewhere. A `q` equal to a network id also returns that network. |
| `type`    | none     | Comma-separated resource types. A network matches if it moves any of them. Case-insensitive. Unknown types return `400`.                                    |
| `author`  | none     | Exact author name, case-insensitive.                                                                                                                        |
| `source`  | both     | `curated` or `community`.                                                                                                                                   |
| `sort`    | `newest` | `newest` or `name` (A to Z).                                                                                                                                |
| `limit`   | `20`     | Results per page, 0 to 50.                                                                                                                                  |
| `offset`  | `0`      | Results to skip.                                                                                                                                            |

`total` counts every match before `limit` and `offset` apply. `limit=0` returns only the count.

```
GET /api/library/search?q=eldritch
```

```json
{
  "total": 1,
  "results": [
    {
      "id": "eldritch-automation.lnet",
      "source": "curated",
      "name": "Eldritch Automation",
      "description": "Eldritch Miner with auto repair",
      "author": "AlmanaX21",
      "types": ["ITEM"],
      "createdAt": 1780790400000,
      "links": {
        "visualiser": "https://logistics-network.almanax21.com/visualiser.html?net=eldritch-automation.lnet",
        "file": "https://logistics-network.almanax21.com/library/eldritch-automation.lnet",
        "image": "https://logistics-network.almanax21.com/api/library/image.png?id=eldritch-automation.lnet"
      }
    }
  ]
}
```

### Checking for changes

Every search reply carries an `ETag`. The tag covers the whole filtered library, not only the page returned, so it changes whenever any matching network is published, edited, deleted or hidden. Send the last tag back in `If-None-Match`, and the reply is `304 Not Modified` with no body when nothing has changed:

```
GET /api/library/search?limit=50
If-None-Match: "kO2…"
```

A bot that keeps its own copy of the library can poll the first page this way and re-read the rest only when it gets a `200`. A `304` still counts towards the rate limit.

## Network details

```
GET /api/library/network?id=<id>
```

Returns the network object plus figures read from its `.lnet` file:

| Field                  | Meaning                                                               |
| ---------------------- | --------------------------------------------------------------------- |
| `stats.nodes`          | Node count.                                                           |
| `stats.hidden`         | Nodes hidden in game.                                                 |
| `stats.activeChannels` | Enabled channels across all nodes.                                    |
| `stats.links`          | Flows between nodes, as drawn in the visualiser.                      |
| `stats.types`          | Active channels per resource type.                                    |
| `nodes[]`              | `label`, `visible`, and `type` (first active channel's type or null). |

```
GET /api/library/network?id=eldritch-automation.lnet
```

```json
{
  "id": "eldritch-automation.lnet",
  "source": "curated",
  "name": "Eldritch Automation",
  "description": "Eldritch Miner with auto repair",
  "author": "AlmanaX21",
  "types": ["ITEM"],
  "createdAt": 1780790400000,
  "links": { "visualiser": "…", "file": "…", "image": "…" },
  "stats": {
    "nodes": 3,
    "hidden": 0,
    "activeChannels": 6,
    "links": 3,
    "types": { "ITEM": 6 }
  },
  "nodes": [
    { "label": "Ore Store", "visible": true, "type": "ITEM" },
    { "label": "Mineshaft", "visible": true, "type": "ITEM" },
    { "label": "XP Tank", "visible": true, "type": "ITEM" }
  ]
}
```

## Network image

```
GET /api/library/image.png?id=<id>
```

A 1600 × 900 PNG of the network graph in the visualiser's style: nodes coloured by resource, arrows for flow direction, labels cut to 16 characters. The same network always gives the same picture. Responses carry `Cache-Control: public, max-age=86400`.

Use the URL directly as a Discord embed image; Discord fetches and caches it. Networks with more than 300 nodes are not drawn (`422 too-many-nodes`).

## Other public endpoints

| Endpoint                         | Returns                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `GET /api/networks`              | Every community network as a bare array of network objects without `source` or `links`, newest first.       |
| `GET /api/networks/file?id=<id>` | A community network's `.lnet` file. Curated files are static, at `/library/<id>`. `links.file` covers both. |

## Errors

| Status | `error`              | When                                                                      |
| ------ | -------------------- | ------------------------------------------------------------------------- |
| 400    | `bad-type`           | `type` names an unknown resource.                                         |
| 400    | `bad-source`         | `source` is not `curated` or `community`.                                 |
| 404    | `not-found`          | No network has that id, or its author's account is suspended.             |
| 422    | `unreadable-network` | The stored `.lnet` file cannot be parsed. Search results still list it.   |
| 422    | `too-many-nodes`     | Details or image asked for a network with more than 300 nodes.            |
| 429    | `rate-limited`       | Too many requests from one IP address. Wait the seconds in `Retry-After`. |

## Rate limits

Per client IP address, in a 5-minute window that starts with the first request:

- Search and network details: 300 requests combined.
- Images: 30 newly drawn images. Images already drawn are served from memory and do not count.

A `429` reply has a `Retry-After` header giving the whole seconds until the window resets. A bot that caches search results for a few minutes stays well inside these limits.

## Discord bot example

Autocomplete a slash command option from search, then reply with an embed. Plain `fetch`, any Discord library:

```js
const base = "https://logistics-network.almanax21.com";

// Autocomplete: up to 25 choices
async function suggest(text) {
  const url = `${base}/api/library/search?limit=25&q=${encodeURIComponent(text)}`;
  const { results } = await (await fetch(url)).json();
  return results.map((network) => ({ name: network.name, value: network.id }));
}

async function embedFor(id) {
  const response = await fetch(
    `${base}/api/library/network?id=${encodeURIComponent(id)}`,
  );
  if (!response.ok) return null;
  const network = await response.json();
  return {
    title: network.name,
    url: network.links.visualiser,
    description: network.description,
    fields: [
      { name: "Author", value: network.author, inline: true },
      {
        name: "Resources",
        value: network.types.join(", ") || "None",
        inline: true,
      },
      { name: "Nodes", value: String(network.stats.nodes), inline: true },
    ],
    image: { url: network.links.image },
  };
}
```
