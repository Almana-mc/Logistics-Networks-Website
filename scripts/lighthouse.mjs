import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const userDataDir = resolve("artifacts/lighthouse/chrome-profile");
await mkdir(userDataDir, { recursive: true });
const chrome = await launch({ chromeFlags: ["--headless"], userDataDir });
const results = [];
await mkdir("artifacts/lighthouse", { recursive: true });
try {
  for (const route of ["index", "library", "docs", "visualiser"]) {
    const report = await lighthouse(`http://127.0.0.1:8794/${route}.html`, {
      port: chrome.port,
      output: ["html", "json"],
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    });
    await writeFile(`artifacts/lighthouse/${route}.html`, report.report[0]);
    await writeFile(`artifacts/lighthouse/${route}.json`, report.report[1]);
    const { categories, audits } = report.lhr;
    const row = {
      route,
      ...Object.fromEntries(
        Object.entries(categories).map(([key, value]) => [
          key,
          Math.round(value.score * 100),
        ]),
      ),
      lcp: Math.round(audits["largest-contentful-paint"].numericValue),
      cls: audits["cumulative-layout-shift"].numericValue,
    };
    results.push(row);
    console.log(JSON.stringify(row));
  }
  await writeFile(
    "artifacts/lighthouse-results.json",
    JSON.stringify(results, null, 2),
  );
} finally {
  await chrome.kill();
}
