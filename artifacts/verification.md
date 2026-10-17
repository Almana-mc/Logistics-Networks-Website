# Redesign verification

14 September 2026. Local production build on branch `rework`, based on `3ed2b0e`.

All four routes use the supplied logo and favicon. Teal brand surfaces, charcoal tools, stone-colored text and self-hosted Barlow now form one design system. The three real library exports, original parser, partner asset/link and domain file remain intact.

## Automated checks

- Production build, ESLint, strict TypeScript, Prettier and `git diff --check`: passed.
- Unit checks: **8 passed**. Covers all bundled parser fixtures, manifest normalization/filtering, safe library paths, optional storage, guide routes, Markdown protocol safety, heading structure and rate-limited version discovery.
- Browser checks: **33 passed**, zero failed, skipped or flaky. Chromium, Firefox and WebKit; 11 checks per engine. Final suite duration: 70.4 seconds.
- Responsive sweep: every route at 320, 390, 768, 1024 and 1440 px. No document overflow; one main landmark and H1 per route; working mobile navigation and Escape focus restoration.
- Axe WCAG 2 A/AA and 2.1 AA: zero violations in the tested route states. Measured token contrast includes 13.29:1 primary text, 5.91:1 muted text and 4.75:1 control boundaries on their tested backgrounds.
- Library search, resource filters, sorting, empty/error states, pagination and visualiser handoff pass. Docs chapter links, version persistence, unavailable-guide recovery and stable loading positions pass.
- Real local file import, node/channel inspection, graph zoom/reset, canvas resize recovery, exact UTF-8 fixture download, invalid-file recovery and example import pass. File import sends no non-GET network request.
- Supplied artwork and `assets/logistic-icon.png` have identical SHA-256: `A587EEA7F69ED46BB4F605C5BC5E87DD86096648B0B4479F59E9BC0B22210973`. Each built favicon response also matches the source bytes in browser tests.
- Production TypeScript functions are at most 40 lines; TS/TSX files at most 250, CSS files at most 300. ESLint enforces the production TypeScript limits.
- Dependency audit during lockfile generation: zero reported vulnerabilities.

## Lighthouse

Lighthouse 13.4.1, installed Chrome 153, simulated mobile throttling, 412 x 823 viewport. One final run per route against the local production preview with gzip delivery; these are lab measurements, not deployed field data.

| Route | Performance | Accessibility | Best practices | SEO | LCP | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 95 | 100 | 96 | 100 | 2.63 s | 0.000 |
| Library | 98 | 100 | 100 | 100 | 2.18 s | 0.000 |
| Docs | 96 | 100 | 96 | 100 | 2.75 s | 0.000 |
| Visualiser | 98 | 100 | 100 | 100 | 2.26 s | 0.000 |

The first implementation measurement exposed docs CLS of 0.609. Reserving the contents row and keeping the footer below the initial viewport reduced the final reading to zero. The build preloads shared modules/fonts and ships route bundles instead of browser Babel. Static graphs redraw on interaction and resize.

Home and Docs score 96 for best practices because the public GitHub API returned HTTP 403 during Lighthouse, including release/version/catalog requests. Existing fallback links, known guide versions and recovery states remain usable. The score was not hidden or bypassed. Raw guide content loaded successfully in Chrome.

Full reports: [Home](lighthouse/index.html), [Library](lighthouse/library.html), [Docs](lighthouse/docs.html), [Visualiser](lighthouse/visualiser.html). Machine-readable results: [browser tests](browser-results.json), [Lighthouse](lighthouse-results.json).

## Visual review

Final full-page screenshots were captured without JavaScript page errors. Review covered hierarchy, spacing, logo treatment, wrapping, touch controls, documentation readability, and graph/details visibility.

| Route | Desktop | Mobile |
| --- | --- | --- |
| Home | [1440 px](home-desktop.png) | [390 px](home-mobile.png) |
| Library | [1440 px](library-desktop.png) | [390 px](library-mobile.png) |
| Docs | [1440 px](docs-desktop.png) | [390 px](docs-mobile.png) |
| Visualiser | [1440 px](visualiser-desktop.png) | [390 px](visualiser-mobile.png) |

## Verification limits and handoff

In this Windows test environment, WebKit cannot resolve GitHub hosts and Firefox times out on the raw guide host. Firefox reproduced the timeout with and without the connection hint. Their browser tests forward GitHub requests through Playwright's Node request client using live responses; Chromium connects directly. Native Safari and Edge were not available for acceptance testing. Automated accessibility checks are not a complete accessibility certification.

No deployed Core Web Vitals or field INP measurement is claimed. The inherited force layout remains quadratic in node count; the three shipped exports are covered, not a large-network stress benchmark. Documentation and release discovery still depend on GitHub availability.

Run `npm run dev` for the local preview at [127.0.0.1:8794](http://127.0.0.1:8794). Deploy `dist/` at the domain root. `_headers` requires a compatible host or proxy; the local security/cache checks do not verify the public domain's headers. No commit, push or deployment was performed.
