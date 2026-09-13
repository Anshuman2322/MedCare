# CureNeed (MedCare) — MERN Medicine Catalog & Inquiry Platform

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/atlas)

## Table of Contents
- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Security & Production Readiness](#security--production-readiness)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running Locally](#running-locally)
- [Running with Docker](#running-with-docker)
- [SEO & Discoverability](#seo--discoverability)
- [Testing](#testing)
- [Known Limitations / Not Yet Implemented](#known-limitations--not-yet-implemented)
- [Project Structure](#project-structure)
- [Additional Documentation](#additional-documentation)

## Project Overview

CureNeed is a MERN-stack medicine catalog and **inquiry-based ordering system** —
**not** a cart/checkout e-commerce site. This is worth stating explicitly since it's
the most common point of confusion: customers browse medicines and submit an
inquiry (name, city, contact info, desired variant/quantity) rather than adding
items to a cart and paying online. The business then follows up on the inquiry
directly. There is no payment processing anywhere in this codebase, and none is
planned — don't build transactional UI (cart, checkout, payment) into this project.

The project is three independently run apps in one repo:

| App | Purpose |
|---|---|
| `server/` | Express + MongoDB API — medicines, categories, inquiries, contact messages, admin auth |
| `client/` | Customer-facing storefront (React + Vite + Tailwind) |
| `admin/` | Admin dashboard for managing the catalog and inbound leads (React + Vite + Tailwind) |

## Architecture

| App | Dev port | What it serves |
|---|---|---|
| `server` | `5000` | REST API only, no server-rendered pages |
| `client` | `5173` | Public storefront: browse medicines, submit inquiries, submit contact messages |
| `admin` | `5175` | Authenticated dashboard: medicine/category CRUD, inquiry & contact message management |

In production behind Docker (see [Running with Docker](#running-with-docker)),
none of these ports are exposed directly — a Caddy reverse proxy is the sole
entrypoint on `80`/`443` and routes each domain to the right container.

- **Database**: MongoDB Atlas (or any MongoDB 6+ instance — nothing is Atlas-specific).
  If `MONGO_URI` is unset or unreachable, the server falls back to read-only sample
  data from `client/src/data/medicines.json` instead of crashing — write operations
  and admin features require a real connection.
- **Media**: Cloudinary. The server has an authenticated upload endpoint
  (`POST /api/upload`), and the admin panel also uploads images directly from the
  browser to Cloudinary via an unsigned upload preset. Product-facing images are
  requested through Cloudinary's `f_auto,q_auto,w_<size>` transforms (see
  `client/src/utils/medicineDisplay.js`) so the browser gets an auto-format,
  auto-quality image sized for where it's actually rendered, not the original upload.
- **Email**: Resend, used to notify the admin by email when a new inquiry or a new
  Contact-page message comes in.
- **WhatsApp (optional)**: Twilio can additionally forward new-inquiry alerts to
  WhatsApp. It's fully optional — if the Twilio env vars aren't set (or look like
  placeholders), the server logs that alerts are disabled and continues normally.
- **API base URL**: both `client` and `admin` read `VITE_API_URL` to know where the
  API lives. Vite inlines this at **build time**, not runtime — changing it requires
  a rebuild, not just a restart.

## Security & Production Readiness

Items relevant to running this as a real, public-facing deployment:

- **TLS**: `docker-compose.yml` includes a `caddy` service as the sole public
  entrypoint (ports `80`/`443`), reverse-proxying to `client`/`admin`/`server`.
  Caddy obtains and renews Let's Encrypt certificates automatically for real
  domains — no manual certificate handling. See [`Caddyfile`](./Caddyfile) and the
  [Running with Docker](#running-with-docker) section below.
- **HTTP security headers**: both `client/nginx.conf` and `admin/nginx.conf` send
  `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  and `Referrer-Policy: strict-origin-when-cross-origin` on every response.
- **API hardening**: Helmet, a restrictive CORS allowlist (`CORS_ORIGINS`), JSON
  body-size limits, and tiered rate limiting (general API, stricter on auth, and
  on public inquiry/contact submission) — see `server/app.js` and
  `server/middleware/rateLimit.js`.
- **Admin auth**: bcrypt-hashed passwords, `httpOnly` JWT cookies (never exposed
  to client-side JS), and login-attempt lockout after repeated failures.
- **Client resilience**: a top-level React error boundary (`ErrorBoundary.jsx`)
  catches render crashes instead of showing a blank white page, and an explicit
  `*` route (`NotFound.jsx`) handles unknown URLs.
- **Secrets**: every app's real config lives in a gitignored `.env` — only the
  `.env.example` templates are tracked. If a secret (DB password, `JWT_SECRET`,
  Cloudinary API key, admin password, etc.) is ever exposed — committed, pasted
  somewhere, printed by a command like `docker compose config`, logged — rotate it
  immediately rather than assuming it's still safe to use.

This covers what's implemented; it is not a substitute for an independent security
review before handling real customer/patient data at scale.

## Prerequisites

- **Node.js 20+** (the Docker images use `node:20-alpine`; older Node 18 likely
  works but isn't what's tested against)
- **npm** (ships with Node)
- **MongoDB** — an Atlas connection string, or a local/self-hosted MongoDB 6+
  instance. Optional for read-only browsing (see the fallback-data note above),
  required for anything that writes data.
- **Cloudinary account** — required for image uploads to actually work.
- **Resend account** — required for inquiry/contact email notifications to actually send.
- **Twilio account with WhatsApp** — optional, only needed if you want WhatsApp
  alerts in addition to email.
- **Docker + Docker Compose** — optional, only needed for the containerized
  deployment path (see [Running with Docker](#running-with-docker)).

## Setup

```bash
git clone <repo-url>
cd MedCare

# Install dependencies for each app
cd server && npm install && cd ..
cd client && npm install && cd ..
cd admin && npm install && cd ..
```

Each app has a `.env.example` documenting every variable it reads, with inline
comments explaining defaults and what happens if a value is left unset. Copy each
one and fill in real values — never commit the resulting `.env` files.

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
cp admin/.env.example admin/.env
```

**server/.env** — key variables (see `server/.env.example` for the full list):

| Variable | Notes |
|---|---|
| `JWT_SECRET` | **Required.** Server refuses to start without one, or one under 16 characters. |
| `MONGO_URI` | MongoDB connection string. Omit for read-only fallback mode. |
| `CORS_ORIGINS` | Comma-separated allowed origins in production. Defaults to localhost dev ports only — a deliberate fail-closed default. |
| `CLOUD_NAME` / `CLOUD_API_KEY` / `CLOUD_API_SECRET` | Cloudinary, for image uploads. |
| `RESEND_API_KEY` / `ADMIN_EMAIL` | Resend, for inquiry and contact-message email notifications. `ADMIN_EMAIL` doubles as the notification recipient. |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` / `ADMIN_WHATSAPP_TO` | Optional WhatsApp alerts via Twilio. |
| `ADMIN_PASSWORD` | Optional emergency fallback login, only used if MongoDB is unreachable at login time. Leave unset unless you specifically need it. |

**client/.env** and **admin/.env** — both just need `VITE_API_URL` for most setups;
`admin/.env` additionally takes `VITE_CLOUDINARY_CLOUD` / `VITE_CLOUDINARY_PRESET`
for its direct-to-Cloudinary uploads.

### Seeding an initial admin

There's no signup form — the first admin account has to be created directly
against the database. With `ADMIN_EMAIL` and `ADMIN_PASSWORD` set in `server/.env`
(or passed inline):

```bash
cd server
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='SomeStr0ng!Pass' npm run seed:admin
```

This creates a `super_admin` account if one with that email doesn't already exist
— it's safe to re-run. Alternatively, on a completely fresh database with zero
admins, `POST /api/auth/bootstrap` (email + password in the body) creates the
first `super_admin` directly via the API — it refuses to run if any admin already
exists, so it's a one-time-only path. If you need to promote an *existing* admin
account to `super_admin` instead, see `server/promoteToSuperAdmin.js`.

> Note: on some networks, MongoDB Atlas's `mongodb+srv://` connection string can
> fail to resolve via SRV DNS lookup if your local/router DNS resolver doesn't
> handle SRV records well (this happened during testing). If `seed:admin` or the
> server itself fails with a `querySrv ECONNREFUSED` error, try setting
> `DNS_SERVERS=system` in `server/.env`, or point your machine at a public DNS
> resolver (8.8.8.8 / 1.1.1.1).

## Running Locally

Each app runs independently, in its own terminal:

```bash
# Server — http://localhost:5000
cd server
npm run dev

# Client — http://localhost:5173
cd client
npm run dev

# Admin — http://localhost:5175
cd admin
npm run dev
```

## Running with Docker

Each app has a production Dockerfile. The root `docker-compose.yml` runs all three
plus a **Caddy** reverse proxy that is the only service exposing a host port —
`server`, `client`, and `admin` are only reachable through it. This gets you
automatic HTTPS in production with no manual certificate handling.

```bash
cp server/.env.example server/.env   # fill in real values first
cp .env.example .env                 # root .env — domains + build-time API URL
docker compose up --build
```

**Local testing (no real domains set)**: the root `.env` can be left mostly empty —
[`Caddyfile`](./Caddyfile) falls back to plain `localhost` ports:

| Service | Local URL |
|---|---|
| `client` | `http://localhost:8080` |
| `admin` | `http://localhost:8081` |
| `server` (API) | `http://localhost:8082` |

Caddy uses its own local CA for these, so browsers will flag them as untrusted
unless you run `caddy trust` — expected for local testing, not a concern once real
domains are set.

**Production**: set real, publicly resolvable domains in the root `.env` —

```bash
CLIENT_DOMAIN=app.yourdomain.com
ADMIN_DOMAIN=admin.yourdomain.com
API_DOMAIN=api.yourdomain.com
VITE_API_URL=https://api.yourdomain.com
```

— and make sure ports `80` and `443` reach the host (Caddy needs `80` for the ACME
HTTP challenge as well as `443`). Also update `CORS_ORIGINS` in `server/.env` to
`https://app.yourdomain.com,https://admin.yourdomain.com` so the API accepts
requests from the real domains. `VITE_API_URL` is baked into the client/admin
builds at **build time**, so changing it requires a rebuild:

```bash
docker compose build client admin
docker compose up -d
```

**Known limitation carried over from the non-Docker path:** `server`'s no-database
fallback mode reads/writes `client/src/data/medicines.json` and `categories.json`
— a relative path assuming `client/` sits next to `server/` on disk. That's true in
this repo's Docker build context, but only matters if `MONGO_URI` is wrong or
MongoDB is unreachable; with a working `MONGO_URI` it's never touched.

> This reverse-proxy setup has been validated for syntax/config correctness
> (`docker compose config`, `caddy validate`-equivalent checks) but not yet
> live-tested end-to-end against a real domain and a running Let's Encrypt
> challenge — do a real smoke test (cert issuance, all three domains reachable
> over HTTPS) on first deploy.

## SEO & Discoverability

- `client/public/robots.txt` and `client/public/sitemap.xml` list the static
  public routes (dynamic `/medicine/:slug` product pages are intentionally
  excluded from the sitemap for now).
- Every route renders a `<SEO>` component (`client/src/components/SEO.jsx`, backed
  by `react-helmet-async`) with a unique `<title>`, meta description, canonical
  URL, and Open Graph / Twitter Card tags — product pages get a
  Cloudinary-optimized `og:image` sized for social previews.
- **Caveat**: these tags are rendered client-side (no SSR). Search engines that
  execute JavaScript (Googlebot) see them fine; some non-JS link-preview bots
  (certain chat-app unfurlers) may not. Add SSR/prerendering later if that
  becomes a problem for a specific platform.

## Testing

Every app has a test suite that runs standalone, with no external services
required (the server suite uses an in-memory MongoDB):

```bash
cd server && npm test   # Jest + Supertest
cd client && npm test   # Vitest
cd admin  && npm test   # Vitest
```

As of this update, all three pass cleanly on a fresh checkout: server 26/26
(8 suites), client 4/4, admin 1/1.

## Known Limitations / Not Yet Implemented

- **No cart or checkout, by design.** An earlier "Add to Cart" UI existed but only
  wrote to `localStorage` with no page to ever view or check out that cart, while
  the server's `POST/GET /api/orders` endpoints have no client caller anywhere.
  The cart UI has been removed; **the inquiry flow is the intended and only
  purchase-adjacent mechanism** in this app. `/api/orders` still exists
  server-side but is unused — it's a candidate for removal if you're not planning
  to build it out into a real checkout flow.
- **Contact page messages have no reply mechanism.** Submissions from the Contact
  page are stored, emailed to the admin, and viewable in the admin panel's
  "Messages" view, but there's no in-app way to reply — you'd reply via the
  customer's email address manually.
- **`FeaturedMedicines` (homepage) has one fallback message for loading, error,
  and empty states.** Unlike the Navbar search and Shop page (which show distinct
  loading/error/empty UI), a failed fetch and a genuinely empty catalog both
  render the same "Featured medicines will appear here once available." text —
  minor UX polish, not a functional bug.
- **No CI/CD pipeline** is configured. `npm test` works cleanly in all three apps,
  so wiring it into GitHub Actions (or similar) is a small addition whenever
  that's a priority.
- **No committed lockfile.** `package-lock.json` is gitignored, so installs across
  environments aren't guaranteed byte-identical. Committing lockfiles is the
  standard fix if reproducible builds become a priority.
- **JWT logout is client-side only.** Admin sessions are stateless JWTs with no
  server-side revocation list — logging out clears the browser's cookie, but a
  copied/stolen token stays valid until it naturally expires (`JWT_EXPIRES`,
  default 1 day). Worth a decision (token blacklist, or short-lived tokens with
  refresh) if that risk matters for your deployment.
- **No automated deletion cascade** between medicines/categories and the
  inquiries/orders that reference them. Deleting a medicine or category doesn't
  crash anything, but inquiries can end up with a dangling `medicineId`, and
  medicines can retain a category name after that category is deleted — both are
  silently stale rather than actively broken.
- **Caddy/TLS reverse proxy is unvalidated end-to-end.** See the caveat at the
  end of [Running with Docker](#running-with-docker).

## Project Structure

```
MedCare/
├─ Caddyfile            # Reverse proxy / TLS config for docker-compose's caddy service
├─ .env.example          # Root env template (Caddy domains, build-time VITE_API_URL)
├─ docker-compose.yml
│
├─ server/
│  ├─ config/         # DB connection, env validation, logger, Cloudinary config
│  ├─ controllers/     # Route handlers (medicines, categories, inquiries, contact, auth, admin)
│  ├─ middleware/       # Auth guards, rate limiting, upload handling, error handling
│  ├─ models/          # Mongoose schemas (Medicine, Category, Inquiry, ContactMessage, Admin, Order)
│  ├─ routes/           # Express routers, one per resource
│  ├─ scripts/          # One-off scripts: seedAdmin, seedCategories, resendSample
│  ├─ tests/            # Jest + Supertest suite
│  └─ server.js / app.js
│
├─ client/
│  ├─ public/
│  │  ├─ robots.txt / sitemap.xml
│  │  └─ hero/, videos/       # Hero section image/video assets
│  ├─ src/
│  │  ├─ api/           # Client-side data-fetch helpers
│  │  ├─ components/    # Navbar, Footer, Hero, BrandMarquee, ErrorBoundary, SEO,
│  │  │                 # product cards, category sections, etc.
│  │  ├─ pages/         # Route-level pages (Shop, MedicineDetails, About, Contact,
│  │  │                 # legal pages, NotFound, ...)
│  │  ├─ services/      # Inquiry submission API calls
│  │  ├─ store/         # Currency context
│  │  ├─ utils/         # Formatting, wishlist, animation, Cloudinary-transform helpers
│  │  └─ tests/         # Vitest suite
│  └─ vite.config.js
│
└─ admin/
   ├─ src/
   │  ├─ api/           # Axios-based API clients per resource
   │  ├─ components/    # Layout (Sidebar/Topbar), ProtectedRoute
   │  ├─ context/        # Auth context
   │  ├─ pages/           # Dashboard, Medicines, Categories, Inquiries, Messages, AdminManagement, Login
   │  ├─ utils/
   │  └─ tests/          # Vitest suite
   └─ vite.config.js
```

## Additional Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — a deeper, implementation-led architecture
  write-up (data flow diagrams, DB schema, auth sequence, API conventions, code
  quality review). Written as a point-in-time audit — treat it as a detailed
  companion to this README, not as always-current.
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — deployment paths beyond Docker (building
  each app for production manually, serving static builds, database/migration
  notes, health checks).
- [`COMPONENT_UPDATES.md`](./COMPONENT_UPDATES.md) — historical log of frontend
  component redesigns.

---

No license has been declared yet — add one (e.g. MIT) at the repository root if
you plan to open-source this project.
