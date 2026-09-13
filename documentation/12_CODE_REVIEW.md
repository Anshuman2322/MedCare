# Code Review

## Overall rating

**7/10 — solid layered application foundation with meaningful operational/security controls, but material contract drift and several incomplete operational features.** This is an architectural assessment from source inspection, not a production penetration test or benchmark.

## Strengths

- Clear separation of two SPAs from Express resource layers.
- Practical security baseline: JWT cookies, bcrypt, lockout, CORS, Helmet, rate limits, redacted Pino logs, validation, 5xx masking.
- Mongoose indexes/constraints, admin ownership transaction, fallback catalogue strategy, Docker/Nginx setup, and multi-level tests.
- Purposeful inquiry model snapshots customer product selection rather than relying solely on mutable medicine data.

## Weaknesses/technical debt

- Controllers own many concerns; service/repository layers are absent.
- `categoryModel.js` duplicates the active Category model.
- Category uses a string association and no cascades.
- Inconsistent API envelopes and validation approach; no API version/spec.
- Permission and inquiry request contracts drift between client and API.
- Direct unsigned uploads rely on external Cloudinary configuration.
- Orders endpoint is unused and public creation has limited safeguards.
- JSON fallback is not safe durable/concurrent persistence.

## Performance/scalability/maintainability

Static SPAs, compression, indexed common catalog queries, and stateless cookie JWTs support a modest workload. Large inline controllers and duplicated/inconsistent contracts increase maintenance cost. Horizontal deployment is constrained by local rate-limit counters and fallback file writes. Cache/query state, queue-based notifications, formal migrations, metrics, and scalability load testing are **Not Implemented**.

## Security/code quality

The baseline is good for the shown code, but refresh/revocation, CSRF, MFA/reset, audit logging, scanning, central secrets management, and a proven Cloudinary preset policy are **Not Implemented**. Content-protection JavaScript should not be treated as security. See [08_SECURITY.md](08_SECURITY.md).
