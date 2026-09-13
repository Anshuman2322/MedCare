# Deployment Documentation

## Artifacts

`client/Dockerfile` and `admin/Dockerfile` build Vite assets with Node 20 Alpine and serve them using Nginx. `server/Dockerfile` installs production dependencies and runs `node server.js`. `docker-compose.yml` builds/runs server (`5000`), client (`5173` host→80), and admin (`5175` host→80).

## Environment variables

- Server: `JWT_SECRET` required; `MONGO_URI`, `MONGO_DB`, `PORT`, `NODE_ENV`, `JWT_EXPIRES`, CORS, rate-limit, bcrypt/lockout, Cloudinary, Resend, Twilio, DNS, and logging settings are documented in `server/.env.example`.
- Client: `VITE_API_URL`.
- Admin: `VITE_API_URL`, `VITE_CLOUDINARY_CLOUD`, `VITE_CLOUDINARY_PRESET`; `VITE_MEDICINE_ASSET_ORIGIN` is read with a default in a utility but not shown in its example.

Vite variables are baked in at build time. Rebuild client/admin after changing them.

## Nginx and production build

Both Nginx configs enable gzip, cache `/assets` for one year, and route unknown paths to `index.html` for React Router. `npm run build` emits each SPA’s `dist`; server has no compile step. Express may serve `client/dist` itself when `NODE_ENV=production`.

## Hosting/deployment procedure

Portable procedure: create actual env files, configure MongoDB/external providers, run `docker compose up --build`, verify `GET /api/health`, and confirm both browser builds target the deployed API URL. Domain, DNS, TLS termination, provider configuration, secrets manager, and live hosting location are **Not Implemented / not identifiable**.

## Rollback/scaling/monitoring

Rollback strategy, image registry, blue-green/canary deployment, autoscaling, database backups, alerts, metrics/tracing, and centralized log retention are **Not Implemented**. The app has a JSON health endpoint and structured stdout logging. Horizontal API scaling requires shared MongoDB and external providers; in-memory rate limit counters and JSON fallback writes are not distributed.
