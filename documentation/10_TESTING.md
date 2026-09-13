# Testing Documentation

## Strategy implemented

The repository has server Jest/Supertest integration tests, client/admin Vitest component tests, and Playwright browser E2E tests. `scripts/run-all-tests.js` orchestrates project tests; root `playwright.config.js` can start/reuse all three apps.

## Test inventory

| Area | Evidence | Coverage focus |
|---|---|---|
| API | `server/tests/*.test.js` | auth/login lockout, health, medicine read/write auth, inquiry creation/reference IDs, CORS, rate limits, dev/prod test-email route |
| Client unit/component | `client/src/tests/` | Home, contact render, shop loading/error |
| Admin unit/component | `admin/src/tests/Login.test.jsx` | Login form render |
| E2E client | `e2e/client/` | navigation, hero, carousel, cards, footer, modal, shop links |
| E2E admin | `e2e/admin/` | auth setup, sidebar active state, categories, branding |

Server test setup uses `mongodb-memory-server`; external provider credentials are blanked (`server/tests/setup.js`). Playwright needs usable server/client/admin processes and its admin setup reads `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

## Coverage/manual testing

Coverage percentage/threshold/report configuration is **Not Implemented**. Visual regression testing, accessibility testing, load/performance testing, security testing, production smoke-test automation, and test data lifecycle policy are **Not Implemented**.

Manual testing implied by UI behavior should include public catalogue, valid inquiry modal submission, contact, admin login/CRUD, upload, denied access, and production CORS/cookie behavior. The flat inquiry wizard should be manually confirmed as a known failing API contract flow.

## Known issues

- Wizard payload/controller mismatch.
- Missing permission-update endpoint despite admin UI call.
- `/me` excludes non-super permissions needed by client route guard.
- No evidence that every endpoint or fallback database mode has automated coverage.
