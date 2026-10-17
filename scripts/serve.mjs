import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { gzipSync } from "node:zlib";

const root = resolve("dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".lnet": "text/plain",
};
const headers = Object.fromEntries(
  (await readFile("_headers", "utf8"))
    .split("\n")
    .filter((line) => line.startsWith("  "))
    .map((line) => {
      const at = line.indexOf(":");
      return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
    }),
);
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    let path = resolve(root, "." + pathname);
    if (path !== root && !path.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
    let body = await readFile(path);
    const compressed =
      /\.(html|js|css|json|lnet)$/.test(path) &&
      (request.headers["accept-encoding"] || "").split(",").some((encoding) => {
        const [name, quality = "q=1"] = encoding.trim().split(";");
        return (
          name.trim() === "gzip" &&
          Number(quality.trim().replace(/^q=/, "")) > 0
        );
      });
    if (compressed) body = gzipSync(body);
    response.writeHead(200, {
      ...headers,
      Vary: "Accept-Encoding",
      ...(compressed ? { "Content-Encoding": "gzip" } : {}),
      "Content-Type": types[extname(path)] || "application/octet-stream",
      "Cache-Control": pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    });
    response.end(body);
  } catch {
    response.writeHead(404, headers).end("Not found");
  }
}).listen(Number(process.env.PORT || 8794), "127.0.0.1", () =>
  console.log("Preview: http://127.0.0.1:" + (process.env.PORT || 8794)),
);
