# Logistics Network website

Homepage, community network library, versioned documentation and a local `.lnet` visualiser. React and strict TypeScript compile to four static pages with esbuild. No upload service is used.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:8794`. `dev` builds and starts the preview; run `npm run build` again after editing. `npm run preview` serves an existing build. Set `PORT` to change the preview port.

```sh
npm run lint
npm run typecheck
npm run format:check
npm run test:unit
npm test
npm run audit:performance
```

Install Playwright browsers with `npx playwright install chromium firefox webkit` when needed. Browser tests use the running production preview. In this Windows environment, WebKit cannot resolve external GitHub hosts and Firefox times out on the raw guide host. Their tests forward GitHub requests through Playwright's Node request client using live responses. Chromium accesses the sources directly. These harness results do not establish native Safari or Edge acceptance.

Deploy the contents of `dist/` at the domain root. The root HTML files are build templates. The build preserves `CNAME` and the library exports, hashes assets, and includes the font license. `_headers` supplies CSP and caching rules for hosts that support that format; GitHub Pages requires a separate response-header configuration or compatible proxy. Preview headers are not evidence of public deployment headers.

`views/` contains routes and their components, `components/` contains shared UI, `lib/` contains data and markdown code, and `styles/` contains tokens and route styles. The existing `.lnet` parser is in `js/lnet.js`; the canvas renderer is in `js/graph.js`. Library submissions remain in `library/index.json`.

The supplied artwork is preserved in `assets/logistic-icon.png` and used as both logo and favicon. Fonts are self-hosted: Barlow (included SIL Open Font License) on most pages, and Archivo, JetBrains Mono and Pixel Operator on the docs page. Audit and verification records are in `artifacts/`.
