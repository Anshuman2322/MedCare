# Backend Documentation

## Structure

`server/server.js` starts the process; `app.js` composes middleware/routes. `routes/` provides resource routers, `controllers/` own request/domain/persistence logic, `models/` define Mongoose schemas, `middleware/` handles auth/rates/upload/errors, `config/` handles database/logger/env/Cloudinary, `utils/` provides email/regex helpers, `scripts/` are one-off tools, and `tests/` are Jest/Supertest tests.

## Routes/controllers/models

Routes map auth, medicines, categories, inquiries, contact, orders, upload, and administration to their similarly named controllers. `adminRoutes.js` adds dashboard/admin-user/admin-inquiry/contact administration. Models are `Admin`, `Medicine`, `Category`, `Inquiry`, `ContactMessage`, and `Order`. Controller logic directly calls models, including filters, aggregation, pagination, populate, and transactions for super-admin ownership transfers. Service and repository layers are **Not Implemented**.

## Middleware/configuration

Global stack: compression, Helmet, CORS allowlist/credentials, JSON parser 10 MB, cookie parser, Pino HTTP, global rate limiting, routes, not-found, error handler (`app.js`). Route middleware provides JWT `protectAdmin`, `requireRole`, `requirePermission`, express-validator rules, inquiry/auth rate limiters, and Multer memory upload (10 MB). Configuration uses dotenv, Mongo/Mongoose, Cloudinary, Pino, and environment checks.

## Validation/errors/logging

Auth/admin user routes use `express-validator`; inquiry/contact/medicine/category validation is controller/manual; Mongoose contributes schema validation. Intentional errors usually return `{error}` and unexpected errors call `next`, then Pino-log and are production-masked by `errorHandler`. Request logs redact cookie, Authorization, and password fields. Full standardized validation/response contract is **Not Implemented**.

## Runtime behavior

Server validates `JWT_SECRET`, sets optional DNS resolvers, attempts MongoDB, then starts even if DB is offline. Unhandled rejection/exception logs then exits. In production it can serve `client/dist` with an SPA fallback, excluding `/api/*` from that fallback. It cannot serve `admin/dist`.
