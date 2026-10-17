# Website audit and redesign

14 September 2026. Baseline: commit `3ed2b0e`, all four static routes.

## Anti-pattern verdict

Fail. The old interface combines neon glows, a simulated boot sequence, outlined display text, metric tiles and repeated icon cards. Those treatments compete with the supplied charcoal-and-teal Minecraft artwork.

## Audit health

| Dimension | Baseline / 4 | Evidence |
| --- | --- | --- |
| Accessibility | 2 | Axe reports nested interactive upload controls and text contrast as low as 3.28:1. Graph selection is pointer-only. |
| Performance | 1 | Every route downloads Babel and compiles JSX in the browser. Graph animation runs continuously. |
| Responsive design | 2 | At 390px the library navigation exposes only Home and Visualiser; other destinations disappear. |
| Theming | 2 | Homepage overrides the shared palette with inline hex values. No supplied logo or favicon. |
| Anti-patterns | 1 | Boot choreography, glow, outlined headline, decorative metrics and repeated cards. |
| **Total** | **8/20** | **Poor: substantial correction needed** |

## Findings

No P0 findings. Six P1 findings, four P2 findings. Locations refer to the baseline files.

| Severity | Location | Finding and impact | Recommendation |
| --- | --- | --- | --- |
| P1 | `css/app.css:319`, route navigation | Mobile CSS hides destination links without a replacement menu. Pages become difficult to reach. | Shared responsive disclosure navigation. `$impeccable adapt` |
| P1 | `jsx/visualiser.jsx:162` | Upload region is a button containing a second button. Axe flags invalid nested interaction. WCAG 4.1.2. | Native labeled file input and separate example action. `$impeccable harden` |
| P1 | `jsx/visualiser.jsx:130` | Canvas is the only node-selection mechanism. Keyboard users cannot inspect nodes. WCAG 2.1.1. | Synchronized, labeled node picker. `$impeccable harden` |
| P1 | `css/tokens.css:26` | Faint text reaches only 3.28:1 in the visualiser footer. WCAG 1.4.3. | Raise contrast in shared tokens and verify rendered states. `$impeccable colorize` |
| P1 | `jsx/docs.jsx:25`, `:47` | Visualiser links target the removed homepage fragment. Users reach the wrong page. | Point shared navigation at `visualiser.html`. `$impeccable harden` |
| P1 | `jsx/lib.jsx:29`, `jsx/docs-nav.jsx:141` | Unguarded local-storage JSON parsing throws on corrupted cache entries, interrupting release/docs initialization. | Optional safe cache reads/writes and recovery tests. `$impeccable harden` |
| P2 | all HTML entries | Browser Babel adds runtime compilation and an external executable dependency. | Compile route bundles and self-host assets. `$impeccable optimize` |
| P2 | `jsx/sections.jsx:84` | Undefined `Features` export produces a confirmed browser ReferenceError. | Remove obsolete exports with the replacement composition. `$impeccable harden` |
| P2 | `jsx/visualiser.jsx:204`, `jsx/visualiser-page.jsx:56` | Artificial loading delay and nonzero motion under reduced-motion preferences. Graph implies live telemetry despite being inferred. | Immediate parsing results, static inferred graph, explicit explanation. `$impeccable distill` |
| P2 | shared chrome and old design notes | Missing favicon, absent supplied identity, and documentation inconsistent with checked-out code. | Apply the actual logo and update the design record. `$impeccable document` |

Systemic causes: duplicated navigation, inconsistent global colors, and presentation masking the underlying task. Preserve local file parsing, the three real library exports, live guide versions, semantic resource labels, and the existing partner link. Those are useful foundations.

## Authorized implementation

The request explicitly includes cleanup, fixes and a full redesign, so this audit feeds directly into implementation. Direction: block-built, tactile, orderly. Use the supplied logo unchanged, deep teal brand surfaces, charcoal workspaces, stone-colored type and compact square-edged controls. Barlow carries the sturdy lettering without using a pixel display face for prose.

Retain the four routes, `.lnet` semantics and local-only import. Share navigation/footer, replace ornamental cards with clear sections and library rows, make docs readable and graph inspection keyboard-accessible. Compile the existing React stack with installed esbuild; no new UI or animation framework.

## Completed corrections

All ten recorded findings are addressed. Home, Library, Docs and Visualiser share the supplied logo, favicon, typography, color tokens and responsive navigation. The obsolete JSX and CSS have been removed. Local parsing, all three library exports, the partner asset/link and `CNAME` are preserved.

The visualiser now provides native file selection, keyboard node inspection, numbered channels, explicit inferred-link styles and useful recovery states. Documentation retains live version selection and chapter routing, with safe optional caching and validated Markdown links. Loading states describe actual work.

The final review also caught and fixed two loading/rendering defects: documentation content shifted when its contents list arrived, and a temporary zero-width canvas resize corrupted the graph layout. Both have browser regression checks.

Production TypeScript functions meet the 40-line limit; TypeScript files stay below 250 lines and stylesheets below 300. ESLint enforces the TypeScript limits. The build creates separate route bundles, self-hosts the font and artwork, preloads shared modules/fonts, and produces hashed static assets.

No outstanding P0 or P1 issue was found in the tested flows. External GitHub availability, native Safari/Edge acceptance and public hosting configuration remain verification limits, detailed in [verification.md](verification.md). This is a local implementation and audit; nothing has been published.
