import { createServer } from "node:http";
import { createShareApi, readConfig } from "./api.ts";

if (!process.env.ORIGIN?.startsWith("https://"))
  throw new Error("Set ORIGIN to the site's https:// origin.");
const api = createShareApi(readConfig());
const server = createServer((request, response) => {
  const start = Date.now();
  response.on("finish", () => {
    const path = (request.url || "/").split("?")[0];
    const time = Date.now() - start;
    console.log(`${request.method} ${path} ${response.statusCode} ${time}ms`);
  });
  void api(request, response);
});
// Outlive Caddy's upstream keepalive
server.keepAliveTimeout = 125_000;
server.listen(Number(process.env.PORT || 8796), "127.0.0.1");
