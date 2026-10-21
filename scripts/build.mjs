import { build } from "esbuild";
import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname, basename } from "node:path";
import postcss from "postcss";
import autoprefixer from "autoprefixer";

const routes = {
  index: "home",
  library: "library",
  docs: "docs",
  visualiser: "visualiser",
};
const output = resolve("dist");
if (dirname(output) !== process.cwd() || basename(output) !== "dist")
  throw new Error("Build output must stay inside this workspace.");
await rm(output, { recursive: true, force: true });
const result = await build({
  entryPoints: Object.values(routes).map((route) => `views/${route}.tsx`),
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
for (const [file, view] of Object.entries(routes)) {
  const [script, info] = outputs.find(
    ([, entry]) => entry.entryPoint === `views/${view}.tsx`,
  );
  const source = await readFile(`${file}.html`, "utf8");
  const preloads = info.imports
    .filter((entry) => entry.kind === "import-statement")
    .map(
      (entry) =>
        `<link rel="modulepreload" href="${entry.path.replace("dist/", "")}" />`,
    );
  for (const { path } of result.metafile.outputs[info.cssBundle].imports)
    if (path.endsWith(".woff2"))
      preloads.push(
        `<link rel="preload" href="${path.replace("dist/", "")}" as="font" type="font/woff2" crossorigin />`,
      );
  const html = source
    .replace("__STYLE__", info.cssBundle.replace("dist/", ""))
    .replace("__SCRIPT__", script.replace("dist/", ""))
    .replaceAll("__LOGO__", logo)
    .replace("</head>", `${preloads.join("\n")}\n</head>`);
  await writeFile(`dist/${file}.html`, html);
}
await cp("library", "dist/library", { recursive: true });
await cp("assets/fonts/OFL.txt", "dist/assets/OFL.txt");
await mkdir("artifacts", { recursive: true });
await writeFile(
  "artifacts/build.json",
  JSON.stringify(result.metafile, null, 2),
);
console.log("Built all four routes.");
