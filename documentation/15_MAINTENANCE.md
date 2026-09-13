# Maintenance Guide

## Daily

- Check `GET /api/health` and inspect Pino logs for DB/integration/auth errors.
- Review new inquiries/contact messages in admin; confirm Resend/Twilio delivery when configured.
- Check Cloudinary upload failures and storage usage.

## Weekly

- Review admin accounts/roles and lockout events.
- Test public catalogue, login, protected admin access, an inquiry modal submission, and contact submission.
- Review dependency advisories and external provider dashboards.

## Monthly

- Apply tested dependency/security updates and execute server/client/admin tests.
- Verify CORS origins, JWT policy, Cloudinary unsigned-preset restrictions, provider credentials, and production environment configuration.
- Validate MongoDB backup restoration in a non-production environment if backups are configured externally.

## Yearly / scheduled

- Rotate secrets and review access owners; renew domain/TLS/provider subscriptions.
- Reassess policy/legal pages and account permissions.
- Upgrade Node/base images/framework versions after compatibility testing.

## Backup/monitoring

Application-managed MongoDB backup, restore automation, monitoring/alerting, uptime monitors, metrics, tracing, log aggregation, and retention policy are **Not Implemented**. Use database/hosting/provider controls and document the selected runbook before production reliance.

## Safe operations

Build Vite after any `VITE_*` change. Do not edit generated `dist` output. Avoid relying on JSON fallback as production persistence; keep MongoDB healthy. Before production updates run appropriate `npm test` suites and `npm run build`; conduct a smoke test using the deployed API and HTTPS domain.
