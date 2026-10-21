# Logistics Network website

Homepage, community network library, versioned documentation and a local `.lnet` visualiser. React and strict TypeScript compile to four static pages with esbuild. No upload service is used.

```sh
npm ci
npm run dev
```

Open `http://localhost:8794` (passkeys refuse IP addresses). The preview mounts the API from `server/`, keeps its SQLite file in `.data/`, and writes emails to `.data/outbox/` instead of sending them. `dev` builds and starts the preview; run `npm run build` again after editing. `npm run preview` serves an existing build. Set `PORT` to change the preview port.

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

1. Install Node 24.7 or later (nodejs.org), Caddy 2 (caddyserver.com/docs/install) and `rsync`. `node` and `npm` must be on the default `PATH` at `/usr/bin/node` (the systemd unit and the deploy's non-interactive SSH use it); for a tarball install, `sudo ln -s /usr/local/bin/node /usr/bin/node` and the same for `npm`. Give the VPS at least 1 GB of RAM, and open ports 80 and 443.
2. Create the deploy user and site folder:
   `sudo adduser --disabled-password --gecos "" deploy`, then `sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh`, put the CI public key in `/home/deploy/.ssh/authorized_keys` (owned by `deploy`, mode 600), and `sudo install -d -o deploy -g deploy /srv/logistics-network /srv/logistics-network/dist`.
3. Point `logistics-network.almanax21.com` (A/AAAA) at the VPS.
4. Copy `deploy/Caddyfile` from a clone of this repo to `/etc/caddy/Caddyfile`, then `sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy`. Caddy obtains the certificate on the first request.
5. Add repository secrets: `VPS_HOST`, `VPS_USER` (`deploy`), `VPS_SSH_KEY` (CI private key), `VPS_KNOWN_HOSTS` (output of `ssh-keyscan` for the same host as `VPS_HOST`).
6. Turn off GitHub Pages in the repository settings.
7. API service (finish this before the first push to `main`, or the deploy fails):
   - `sudo useradd --system --no-create-home --shell /usr/sbin/nologin lnet`
   - `sudo install -d -m 700 /etc/logistics-network && sudo install -m 600 /dev/null /etc/logistics-network/env`, then fill it in (variables below).
   - `sudo cp deploy/logistics-network.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable logistics-network`
   - `echo 'deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart logistics-network' | sudo tee /etc/sudoers.d/logistics-network && sudo chmod 440 /etc/sudoers.d/logistics-network && sudo visudo -cf /etc/sudoers.d/logistics-network`
   - Copy `deploy/Caddyfile` to `/etc/caddy/Caddyfile` again and reload Caddy.
   - Configure an SMTP provider. Publish SPF, DKIM and DMARC records for the `MAIL_FROM` domain before going live.
   - Time one password hash on the VPS: `cd /srv/logistics-network && node -e "import('./server/passwords.ts').then(async (p) => { const t = Date.now(); await p.hashPassword('timing check password', Buffer.alloc(32)); console.log(Date.now() - t + ' ms'); })"`. Keep it between 100 and 500 ms. If it is slower, lower `memory` in `current` in `server/passwords.ts` (floor: 19456 KiB with `passes: 2`). Existing hashes keep working and are upgraded on the next sign-in.

To switch over without downtime, do steps 1, 2, 4, 5 and 7 first, merge to `main` so the first deploy fills `/srv/logistics-network/dist`, then point DNS (step 3) and turn off GitHub Pages (step 6). Pages keeps serving its last build until then.

### API environment

`/etc/logistics-network/env` (mode 600). The API refuses to start if `ORIGIN`, `DB_PATH`, `TRUST_PROXY`, `SERVER_SECRET`, `SMTP_URL` or `MAIL_FROM` is missing or wrong:

```
ORIGIN=https://logistics-network.almanax21.com
PORT=8795
DB_PATH=/var/lib/logistics-network/app.db
TRUST_PROXY=1
SERVER_SECRET=<output of: openssl rand -base64 32>
SMTP_URL=smtps://user:password@smtp.example.com:465
MAIL_FROM=Logistics Network <accounts@almanax21.com>
```

`SERVER_SECRET` is permanent. It derives the password pepper, so losing or changing it invalidates every password. Back it up somewhere separate from the database. Never set `RATE_LIMITS=off` in production; the API refuses to start with it.

Percent-encode the SMTP username and password inside `SMTP_URL` (for example with `encodeURIComponent`).
