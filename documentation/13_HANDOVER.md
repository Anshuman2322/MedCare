# Agency Handover

## Project details

Project: MedCare / CureNeed. Components: `client` public SPA, `admin` protected SPA, `server` Node/Express API. Primary repository guide: `README.md`; deployment guide: root `DEPLOYMENT.md`.

## Server/hosting/domain

Server command: `cd server && npm start`; default port 5000. Client/admin build with `npm run build`. Docker Compose exposes 5000/5173/5175. Actual hosting provider, domain names, DNS records, TLS certificate owner, reverse proxy configuration, server IP, and production region are **Not Implemented / not identifiable**.

## Database and storage

MongoDB uses `MONGO_URI`/`MONGO_DB`; Cloudinary stores uploaded images. Actual database cluster, access owner, backup schedule, retention, restore runbook, and media lifecycle policy are **Not Implemented / not identifiable**.

## Credentials checklist

Transfer securely, never commit: Mongo URI; JWT secret; Cloudinary cloud/key/secret; Resend key/from/recipient; Twilio SID/token/from/destination if enabled; admin seed credentials; CORS origins; Docker/hosting account access; domain/DNS access. Browser-safe build values are VITE API URL and Cloudinary unsigned preset/cloud; do not expose server secrets there.

## Support notes/known issues

Verify `/api/health`, CORS production origins, cookie Secure behavior behind TLS, Mongo connection, Cloudinary uploads, and inquiry notifications after deployment. Known issues: wizard request mismatch; client permission mismatch; missing permissions update endpoint; no token revocation; no cascade deletes. Warranty terms, SLA, support contacts, incident escalation, and ownership agreements are **Not Implemented**.
