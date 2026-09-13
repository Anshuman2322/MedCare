# Deployment

MedCare is three independently deployable pieces:

| App | What it is | Local dev port | Prod artifact |
|---|---|---|---|
| `server/` | Express API + MongoDB | 5000 | Node process |
| `client/` | Customer storefront (React/Vite) | 5173 | Static build |
| `admin/`  | Admin dashboard (React/Vite) | 5175 | Static build |

`client` and `admin` are static single-page apps once built — they can be
served by anything that serves static files (Nginx, Vercel, Netlify, S3+CDN,
Render's static site product, etc). `server` needs a long-running Node
process, so it goes wherever you can run `node server.js` continuously
(Render/Railway web service, a VPS, a container platform, ...). Nothing here
is tied to a specific host — see the Docker section below for the portable
path.

## 1. Environment variables

Every app has a `.env.example` listing what it reads, with inline comments.
Copy it to `.env` in the same directory and fill in real values — `.env` is
gitignored everywhere, `.env.example` is intentionally tracked.

```
cp server/.env.example server/.env
cp client/.env.example client/.env
cp admin/.env.example admin/.env
```

**server/.env** — the only hard requirement is `JWT_SECRET` (the server
refuses to start without one, or with one under 16 characters — see
`server/config/validateEnv.js`). Everything else degrades gracefully if
unset: no `MONGO_URI` → read-only fallback catalog data instead of a crash;
no Cloudinary/Resend/Twilio vars → those features just no-op with a logged
warning instead of failing silently. In production, set `CORS_ORIGINS` to
your real client/admin domains — without it, only `localhost` dev origins
are allowed, which is a deliberate fail-closed default, not a bug.

**client/.env** and **admin/.env** — `VITE_API_URL` is the only one that
matters for most deployments (it's the URL the browser uses to reach the
API). Vite inlines `VITE_*` variables into the JS bundle **at build time**,
not at container/server start time — if you change `VITE_API_URL`, you must
rebuild, not just restart.

## 2. Building for production

```
# server — no build step, just install and run
cd server && npm install && npm start

# client
cd client && npm install && npm run build   # outputs client/dist
cd client && npm run preview                # optional: serve it locally to sanity-check

# admin
cd admin && npm install && npm run build    # outputs admin/dist
```

Serve `client/dist` and `admin/dist` with any static file server. If you
point a webserver's SPA fallback at `index.html` for unknown paths (both
apps use client-side routing via React Router), everything works; without
that, direct links to e.g. `/shop` or `/medicine/some-slug` will 404 on
refresh. `client/nginx.conf` and `admin/nginx.conf` show the fallback rule
if you're rolling your own Nginx config outside Docker.

`server` also has a built-in option to serve `client/dist` itself when
`NODE_ENV=production` (see the bottom of `server/app.js`) — useful if you'd
rather ship client+server as a single deployable unit instead of two. This
does **not** cover `admin`; it's always a separate static deploy.

## 3. Docker (portable path — works the same on any host)

Each app has a `Dockerfile`; `docker-compose.yml` at the repo root runs all
three together as a local production-like stack:

```
cp server/.env.example server/.env   # fill in real values first
docker compose up --build
```

`server`, `client`, and `admin` no longer publish host ports directly — a `caddy`
service in front of them is the sole entrypoint (ports `80`/`443`), reverse-proxying
each to the right container. With no domains configured, Caddy falls back to plain
`localhost` ports: `client` on `:8080`, `admin` on `:8081`, `server`/API on `:8082`
(see [`Caddyfile`](./Caddyfile)).

To point the client/admin builds at a non-default API URL (e.g. deploying to
a real domain), set it in the root `.env` (or override the build arg directly) and
rebuild:

```
VITE_API_URL=https://api.yourdomain.com docker compose build client admin
docker compose up -d
```

Full detail — including production domain setup (`CLIENT_DOMAIN`/`ADMIN_DOMAIN`/
`API_DOMAIN`, automatic Let's Encrypt certs) — is in the README's
[Running with Docker](./README.md#running-with-docker) section.

**Known limitation:** `server`'s no-database fallback mode reads/writes
`client/src/data/medicines.json` and `categories.json` — a relative path
assuming `client/` sits next to `server/` on disk. That's true in this repo
and in the `docker compose` setup above (each service still builds from a
checkout that has both directories), but if you deploy `server` as a
standalone container/artifact without the rest of the repo, that fallback
path won't resolve. This only matters if `MONGO_URI` is wrong or MongoDB is
unreachable — with a working `MONGO_URI` it's never touched. Get `MONGO_URI`
right in production and this doesn't come up.

## 4. Reverse proxy / TLS

If you're using the Docker path above, this is already handled: `docker-compose.yml`
includes a `caddy` service as the sole public entrypoint, terminating HTTPS with
automatic Let's Encrypt certificates for whatever domains you set in the root
`.env` (`CLIENT_DOMAIN` / `ADMIN_DOMAIN` / `API_DOMAIN`) — see [`Caddyfile`](./Caddyfile)
and the README's [Running with Docker](./README.md#running-with-docker) section.

If you're deploying outside Docker (manual builds, a platform without a built-in
proxy), put a reverse proxy (Nginx, Caddy, your platform's built-in load balancer,
Cloudflare, ...) in front of all three and terminate HTTPS there. The server
already sets `app.set('trust proxy', 1)` so `secure` cookies and rate-limiting
work correctly behind a standard reverse proxy.

## 5. Database

MongoDB Atlas is what this project was built against (`MONGO_URI` is a
`mongodb+srv://...` connection string). Any MongoDB 6+ instance works —
self-hosted or another managed provider — nothing in the code is
Atlas-specific. There's no formal migration tooling; `server/scripts/`
has one-off seed scripts (`seedAdmin.js`, `seedCategories.js`) — run once
against a fresh database:

```
cd server
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='SomeStr0ng!Pass' npm run seed:admin
```

`server/config/validateEnv.js` builds indexes automatically via Mongoose on
connect (`autoIndex`, on by default outside a hand-tuned production setup) —
no separate index-creation step needed.

## 6. Health checks / monitoring

`GET /api/health` returns `{ ok, uptime, timestamp, db }` — `db` is
`"connected"` or `"disconnected"`, so your uptime monitor / load balancer
health check can distinguish "process up" from "process up but DB down."
It's excluded from request logging (see `server/app.js`) to avoid flooding
logs with health-check noise.

## 7. What's deliberately not here

- **CI/CD pipeline** — not set up; `npm test` works cleanly in all three
  apps from a fresh checkout (no external services required — the server
  suite uses an in-memory MongoDB), so wiring it into GitHub Actions/GitLab
  CI/etc. is a small, host-agnostic addition whenever you're ready.
- **A committed lockfile** — `package-lock.json` is gitignored repo-wide
  (pre-existing choice, not something introduced here). This means
  `npm install` (not `npm ci`) is what the Dockerfiles use, and different
  installs could theoretically resolve slightly different dependency
  versions over time. If you want fully reproducible builds, committing the
  lockfiles is the standard fix — that's a call for you to make, not
  something changed here.
