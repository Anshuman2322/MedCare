# Security Documentation

## Implemented controls

- JWT cookie session: signed id/role token, httpOnly, SameSite=Lax, secure in production (`auth.controller.js`).
- Password security: bcrypt pre-save hashing, default 12 rounds; complexity validation; generic invalid-login response; failed-login lockout (`Admin.js`).
- Authorization: `protectAdmin`, `requireRole`, `requirePermission` protect sensitive routes (`auth.middleware.js`).
- HTTP controls: Helmet, compression, CORS allowlist with credentials, JSON 10 MB, trust proxy (`app.js`).
- Rate limits: API 300/15m, auth 20 failed/15m, inquiry/contact 30/15m by defaults (`rateLimit.js`).
- Logging: Pino redaction of tokens/cookies/passwords; production 5xx masking.
- Input safety: express-validator on auth/admin inputs; escaped regex query terms; manual checks in lead/catalog controllers.
- Environment validation: startup refuses missing/short JWT secret; production warns for missing recommended configuration.

## JWT/middleware flow

Login verifies bcrypt password and account state, signs JWT, and writes cookie. Later protected requests supply the cookie automatically from admin Axios; middleware verifies token, loads Admin excluding password, assigns `req.admin`, and role/permission middleware decides access. Logout clears browser cookie.

## Risks and missing features

- Refresh token rotation, server-side logout/revocation, session inventory, and token denylist: **Not Implemented**.
- CSRF tokens/middleware: **Not Implemented**. SameSite=Lax is configured.
- MFA, password reset, email verification, audit logs, security event alerts, SAST/dependency scanning, penetration-test evidence, and WAF: **Not Implemented**.
- Direct Cloudinary unsigned uploads are intentionally public-client configuration; preset restrictions are external and not verifiable here.
- Public order creation accepts PII without an order-specific validation/limiter and has no UI use.
- Client content-protection blocks copy/devtools shortcuts but is not a security control.

## Recommendations (not implemented)

Use only as future maintenance guidance: reconcile client/backend permission contract; repair inquiry contract; restrict Cloudinary preset; add CSRF plus short-lived/refresh or revocable sessions where threat model warrants; validate public order or remove unused surface; introduce audit/monitoring and dependency scanning.
