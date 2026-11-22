# Deployment

MedCare is three independently deployable pieces:

| App | What it is | Local dev port | Prod artifact |
|---|---|---|---|
| `server/` | Express API + MongoDB | 5000 | Node process / container |
| `client/` | Customer storefront (React/Vite) | 5173 | Static build (nginx container) |
| `admin/`  | Admin dashboard (React/Vite) | 5175 | Static build (nginx container) |

`client` and `admin` are static single-page apps once built — they can be
served by anything that serves static files. `server` needs a long-running Node
process. The Docker path below runs all three behind Caddy (automatic HTTPS) and
is the tested, recommended way to deploy.

**Requires Node 22+** (Node 20 reached end-of-life in April 2026; the Dockerfiles
use `node:22-alpine`).

---

## 0. Go-live checklist

Work through this top to bottom the first time. Items marked ⚠ were found during
QA and are easy to miss.

**Accounts and services**

- [ ] **MongoDB Atlas → Network Access:** add the production server's public IP.
      ⚠ This is the most common first-deploy failure: with the IP missing, the API
      can't reach the database and every catalogue/admin request returns `503`.
- [ ] **Resend:** the sending domain in `RESEND_FROM` (currently
      `mail.cureneed.com`) shows *Verified* in the Resend dashboard.
- [ ] **Cloudinary:** the unsigned upload preset used by the admin panel allows only
      image formats and a sensible size/folder (it is called straight from the browser).
- [ ] **Backups:** Atlas backups are on (the free tier has none; use a paid tier or a
      scheduled `mongodump`).

**`server/.env`** (copy from `server/.env.example`; never commit it)

- [ ] ⚠ `JWT_SECRET` is **32+ random characters** — generate one:
      `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
      (the server refuses anything under 16 and warns under 32). Changing it signs
      every admin out once.
- [ ] ⚠ `CORS_ORIGINS` lists the real origins, with scheme and no trailing slash:
      `https://www.cureneed.com,https://admin.cureneed.com`. Without it the browser
      blocks every call from the live site (the API answers `403 Not allowed by CORS`).
- [ ] `MONGO_URI`, `MONGO_DB`, `RESEND_API_KEY`, `RESEND_FROM`, `ADMIN_EMAIL`,
      `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` are set.
- [ ] `ADMIN_PASSWORD` is **unset** (it enables a no-database login fallback).
- [ ] `BUSINESS_EMAIL` / `CRM_EMAIL` are removed — nothing reads them any more; all
      team email goes to `ADMIN_EMAIL` only.
- [ ] Optional: `ANTHROPIC_API_KEY` (smarter support chat and review drafts),
      `PUBLIC_SITE_URL` (defaults to `https://www.cureneed.com`).
- [ ] `NODE_ENV` does not need setting for Docker (compose sets `production`).

**Root `.env`** (for `docker compose`; see `.env.example`)

- [ ] `CLIENT_DOMAIN=www.cureneed.com`, `ADMIN_DOMAIN=admin.cureneed.com`,
      `API_DOMAIN=api.cureneed.com`
- [ ] `VITE_API_URL=https://api.cureneed.com` (baked into the builds — rebuild after
      changing it)
- [ ] `VITE_CLOUDINARY_CLOUD`, `VITE_CLOUDINARY_PRESET` for the admin panel

**DNS (you do this at your DNS provider)**

- [ ] `www`, `admin` and `api` each get an A (and/or AAAA) record pointing at the
      server's public IP, and ports **80 and 443** are open. Caddy needs port 80
      for the Let's Encrypt challenge.
- [ ] ⚠ `www.cureneed.com` currently serves a different site (an older "CureNeed
      Global Solutions" page). Pointing it here replaces that site — keep a copy of
      anything you still need first.
- [ ] All three hostnames must share one registrable domain (`cureneed.com`): the
      admin login cookie is `SameSite=Lax`, so it is only sent between
      subdomains of the same site.

**Data hygiene before real customers arrive**

- [ ] ⚠ The database still holds test data: about 26 inquiries, 7 contact messages,
      55 support chats and 5 website reviews. **Only the reviews are public** (they show
      on `/reviews` and in the "Rated x/5" figure): delete the ones that aren't from
      real customers in the admin panel → Reviews. The admin panel has no delete for
      inquiries, messages or chats: mark the test ones *Closed*, or remove them in the
      Atlas Data Explorer (safe: new reference numbers continue after the highest one
      still in the database).
- [ ] Product *Ocumoist Max Eye Drops* has an empty "strength" — fill it in.

**After the first deploy — smoke test**

```bash
curl -s https://api.cureneed.com/api/health          # {"ok":true,...,"db":"connected"}
curl -sI https://www.cureneed.com | grep -iE "content-security-policy|x-frame-options|strict-transport"
curl -s -o /dev/null -w "%{http_code}\n" https://www.cureneed.com/shop        # 200 (SPA fallback)
curl -s -o /dev/null -w "%{http_code}\n" https://api.cureneed.com/api/orders  # 404 (endpoint removed)
```

Then, in a browser: browse a product, send an inquiry (check `ADMIN_EMAIL` receives it
and the customer gets the thank-you email), open the chat, log in to
`https://admin.cureneed.com` and reply to a chat.

---

## 1. Environment variables

Every app has a `.env.example` listing what it reads, with inline comments.
Copy it to `.env` in the same directory and fill in real values — `.env` is
gitignored everywhere, `.env.example` is intentionally tracked.

```
cp server/.env.example server/.env
cp client/.env.example client/.env
cp admin/.env.example admin/.env
```

**server/.env** — the only hard requirement is `JWT_SECRET`. Everything else
degrades gracefully if unset: no Cloudinary/Resend/Twilio vars → those features
no-op with a logged warning. **No `MONGO_URI` (or an unreachable database):**
in development the API falls back to a bundled sample catalogue; **in production
it answers `503 Service temporarily unavailable`** instead, so an outage never
shows sample products or saves admin edits to a file.

**client/.env** and **admin/.env** — `VITE_API_URL` is the one that matters (the URL
the browser uses to reach the API). Vite inlines `VITE_*` variables into the bundle
**at build time**: change it → rebuild, don't just restart.

## 2. Building for production

```
cd server && npm ci && npm start
cd client && npm ci && npm run build   # outputs client/dist
cd admin  && npm ci && npm run build   # outputs admin/dist
```

Serve `client/dist` and `admin/dist` with any static file server and point its SPA
fallback at `index.html` for unknown paths (both apps use client-side routing).
`client/nginx.conf` and `admin/nginx.conf` show the rule.

`server` can also serve `client/dist` itself when `NODE_ENV=production` **and**
`client/dist/index.html` exists next to it (see the bottom of `server/app.js`).
This does not cover `admin`.

## 3. Docker (recommended)

```
cp server/.env.example server/.env   # fill in real values first
cp .env.example .env                 # domains + VITE_* build args
docker compose up --build -d
```

`caddy` is the sole public entrypoint (`80`/`443`) and reverse-proxies to the
`client`, `admin` and `server` containers, none of which publish a port. With no
domains configured it falls back to `localhost:8080/8081/8082` for local testing.

What the images do:

- **Lockfile-aware installs:** each Dockerfile runs `npm ci` when `package-lock.json`
  is in the build context (commit it — see §7) and `npm install` otherwise.
- **`.dockerignore`** keeps `node_modules`, `.env`, tests and ~135 MB of unused
  legacy images out of the build. Never remove it: without it the host's
  `node_modules` overwrites the image's and secrets end up in the image.
- **`server`** runs as the unprivileged `node` user and has a `HEALTHCHECK` on
  `/api/health`.
- **nginx** sends the security headers (CSP, `X-Frame-Options`, …) on **every**
  response, including the HTML. Cache rules there use `expires`, never
  `add_header` — an `add_header` inside a `location` silently discards all the
  server-level headers.

Useful commands:

```
docker compose ps                      # server shows (healthy) once the API is up
docker compose logs -f server
docker compose build --no-cache client admin   # after changing VITE_API_URL
docker compose up -d                   # roll out
```

**Rollback:** `docker compose up -d` the previous git revision (rebuild), or keep the
previous images tagged. The database is not modified by deploys.

Full detail (domains, automatic Let's Encrypt) is in the README's
[Running with Docker](./README.md#running-with-docker) section.

## 4. Reverse proxy / TLS

Handled by the `caddy` service. Outside Docker, put Nginx/Caddy/your platform's
load balancer in front of all three and terminate HTTPS there. The server sets
`trust proxy` to 1 so `secure` cookies and per-IP rate limits work behind one proxy.

## 5. Database

MongoDB Atlas is what this project was built against (`mongodb+srv://…`); any
MongoDB 6+ works. Indexes are built automatically on connect. Admin accounts
already exist in the current database; for a fresh one:

```
cd server
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='SomeStr0ng!Pass' npm run seed:admin
```

## 6. Health checks / monitoring

`GET /api/health` returns `{ ok, uptime, timestamp, db }`; `db` is `"connected"` or
`"disconnected"`, so a monitor can tell "process up" from "process up but DB down".
Point an uptime monitor at it (and at the storefront URL).

## 7. Dependencies and reproducible builds

- The three `package-lock.json` files are meant to be **committed** (`.gitignore`
  now un-ignores them) so `npm ci` installs exactly what was tested. Add them with
  your next commit.
- ⚠ `vitest` is pinned to `~4.0.18` in `client` and `admin`. With npm 10, a
  *fresh* install (no lockfile) of vitest 4.1.x fails with
  `Cannot read properties of null (reading 'edgesOut')`, which would break every
  Docker build. Revisit the pin when moving to npm 11 / a newer vitest, and
  always re-check that a clean install works: copy the app to an empty folder and
  run `npm ci && npm test && npm run build`.
- Re-run `npm audit --omit=dev` in each app before a release (all three were at
  0 vulnerabilities for production dependencies when this was written).
- After changing dependencies, regenerate the lockfile
  (`rm package-lock.json && npm install`) and commit it.

## 8. What's deliberately not here

- **CI/CD pipeline** — not set up. All suites run without external services
  (`server` uses an in-memory MongoDB), so wiring them into GitHub Actions is small.
- **Tested against real nginx / a live Docker build** — the QA environment had no
  running Docker daemon, so images were verified step-by-step (clean install,
  test, build, header emulation) rather than by `docker compose up`. The first
  real deploy is the first real container run: use the smoke test above.
