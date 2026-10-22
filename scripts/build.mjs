import { build } from "esbuild";
import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname, basename } from "node:path";
import { pathToFileURL } from "node:url";
import postcss from "postcss";
import autoprefixer from "autoprefixer";

const routes = {
  index: "home",
  library: "library",
  docs: "docs",
  visualiser: "visualiser",
  "sign-in": "sign-in",
  account: "account",
};
const output = resolve("dist");
if (dirname(output) !== process.cwd() || basename(output) !== "dist")
  throw new Error("Build output must stay inside this workspace.");
await rm(output, { recursive: true, force: true });
const result = await build({
  entryPoints: [...Object.values(routes), "error"].map(
    (route) => `views/${route}.tsx`,
  ),
  bundle: true,
  splitting: true,
  format: "esm",
  minify: true,
  target: ["chrome120", "firefox121", "safari17", "edge120"],
  outdir: "dist",
  publicPath: "/",
  entryNames: "assets/[name]-[hash]",
  chunkNames: "assets/chunk-[hash]",
  assetNames: "assets/[name]-[hash]",
  loader: { ".png": "file", ".webp": "file", ".woff2": "file" },
  metafile: true,
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [
    {
      name: "autoprefixer",
      setup(builder) {
        builder.onLoad({ filter: /\.css$/ }, async (args) => ({
          contents: (
            await postcss([autoprefixer]).process(
              await readFile(args.path, "utf8"),
              { from: args.path },
            )
          ).css,
          loader: "css",
        }));
      },
    },
  ],
});
const outputs = Object.entries(result.metafile.outputs);
const logoBytes = await readFile("assets/logistic-icon.png");
const logo = `assets/logistic-icon-${createHash("sha256")
  .update(logoBytes)
  .digest("hex")
  .slice(0, 12)}.png`;
await writeFile(`dist/${logo}`, logoBytes);
async function page(file, view) {
  const [script, info] = outputs.find(
    ([, entry]) => entry.entryPoint === `views/${view}.tsx`,
  );
  const source = await readFile(`${file}.html`, "utf8");
  const preloads = info.imports
    .filter((entry) => entry.kind === "import-statement")
    .map(
      (entry) =>
        `<link rel="modulepreload" href="${entry.path.replace("dist/", "/")}" />`,
    );
  for (const { path } of result.metafile.outputs[info.cssBundle].imports)
    if (path.endsWith(".woff2"))
      preloads.push(
        `<link rel="preload" href="${path.replace("dist/", "/")}" as="font" type="font/woff2" crossorigin />`,
      );
  return source
    .replace("__STYLE__", info.cssBundle.replace("dist/", "/"))
    .replace("__SCRIPT__", script.replace("dist/", "/"))
    .replaceAll("__LOGO__", `/${logo}`)
    .replace("</head>", `${preloads.join("\n")}\n</head>`);
}
for (const [file, view] of Object.entries(routes))
  await writeFile(`dist/${file}.html`, await page(file, view));
const renderer = await build({
  entryPoints: ["views/error/render.tsx"],
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  outdir: "artifacts",
  publicPath: "/",
  assetNames: "assets/[name]-[hash]",
  loader: { ".png": "file" },
  write: false,
});
const rendererFile = resolve("artifacts/error-render.mjs");
await writeFile(
  rendererFile,
  renderer.outputFiles.find(({ path }) => path.endsWith(".js")).contents,
);
const { pages } = await import(pathToFileURL(rendererFile).href);
await rm(rendererFile);
const errorPage = await page("error", "error");
await mkdir("dist/errors");
for (const error of pages)
  await writeFile(
    `dist/errors/${error.file}.html`,
    errorPage
      .replace("__TITLE__", error.title)
      .replace("__DESCRIPTION__", error.description)
      .replace("__BODY__", () => error.body),
  );
await cp("library", "dist/library", { recursive: true });
await cp("assets/fonts/OFL.txt", "dist/assets/OFL.txt");
await mkdir("artifacts", { recursive: true });
await writeFile(
  "artifacts/build.json",
  JSON.stringify(result.metafile, null, 2),
);
console.log("Built all routes.");
