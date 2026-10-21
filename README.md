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

`views/` contains routes and their components, `components/` contains shared UI, `lib/` contains data and markdown code, and `styles/` contains tokens and route styles. The existing `.lnet` parser is in `js/lnet.js`; the canvas renderer is in `js/graph.js`. Library submissions remain in `library/index.json`.

The supplied artwork is preserved in `assets/logistic-icon.png` and used as both logo and favicon. Fonts are self-hosted: Archivo and JetBrains Mono under the included SIL Open Font License, and Pixel Operator (CC0 1.0). Audit and verification records are in `artifacts/`.

## Hosting

The site runs on a VPS behind Caddy. Pushing to `main` runs lint, typecheck, unit tests and the build, then `rsync`s `dist/` to `/srv/logistics-network/dist/`. `deploy/Caddyfile` sets TLS, the CSP and security headers, and caching. `_headers` mirrors those headers, except HSTS, for the local preview. Keep the two in sync.

### VPS setup (once)

1. Install Node 24.7 or later (nodejs.org), Caddy 2 (caddyserver.com/docs/install) and `rsync`. Give the VPS at least 1 GB of RAM, and open ports 80 and 443.
2. Create the deploy user and site folder:
   `sudo adduser --disabled-password --gecos "" deploy`, then `sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh`, put the CI public key in `/home/deploy/.ssh/authorized_keys` (owned by `deploy`, mode 600), and `sudo install -d -o deploy -g deploy /srv/logistics-network /srv/logistics-network/dist`.
3. Point `logistics-network.almanax21.com` (A/AAAA) at the VPS.
4. Copy `deploy/Caddyfile` from a clone of this repo to `/etc/caddy/Caddyfile`, then `sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy`. Caddy obtains the certificate on the first request.
5. Add repository secrets: `VPS_HOST`, `VPS_USER` (`deploy`), `VPS_SSH_KEY` (CI private key), `VPS_KNOWN_HOSTS` (output of `ssh-keyscan` for the same host as `VPS_HOST`).
6. Turn off GitHub Pages in the repository settings.
