# Requirements Extracted from the Implementation

This is a reverse-engineered requirements record; no separate approved requirements specification was found.

## Functional requirements

- Public users can list/filter/sort medicines and retrieve one by slug or id (`server/routes/medicineRoutes.js`).
- Public users can submit the nested inquiry payload accepted by `createInquiry` and contact messages (`inquiryController.js`, `contactController.js`).
- Admins can log in/out and query their current session; first-admin bootstrap/register flows exist (`auth.routes.js`).
- Authorized admins can manage medicines and categories; authorized users can inspect dashboard/inquiries/messages (`adminRoutes.js`).
- Super admins can list/create/delete admins and transfer/update ownership roles.
- Product images can upload to Cloudinary by authenticated server endpoint or direct admin unsigned upload.
- New inquiries trigger best-effort Resend email and optional Twilio WhatsApp notification.

## Non-functional requirements

- JSON REST API with browser SPAs and SPA fallback (`app.js`, Nginx configs).
- Password hashing, JWT cookie session, CORS, Helmet, rate limits, structured logs, and 10 MB JSON/upload limits.
- Docker/Compose local production-like deployment.
- Tests: Jest/Supertest, Vitest, and Playwright configuration.

## Business rules

- Medicine requires unique slug, name, and at least one price/stock variant (`Medicine.js`, `medicineController.js`).
- Category name/slug are unique; medicine category must be an active category when database-backed create/update validates it.
- Admin passwords require 8+ characters with upper/lower/number/special character and no spaces.
- Five failed admin logins lock an account for 15 minutes by default.
- Inquiry requires medicine id, customer name/city, quantity >=1, and `box` or `strip` packaging in the controller’s supported nested request shape.
- Only super admins can administer other admin accounts; super admins receive every permission.

## Assumptions

- MongoDB connection and external credentials are supplied through environment variables.
- `VITE_API_URL` is reachable from the browser after build.
- Cloudinary unsigned preset is appropriately restricted outside this source tree.

## Limitations and out of scope

Not Implemented: payment, cart, checkout, customer authentication, order UI, inventory reservation, migrations, documented SLAs, audit trail, token refresh/revocation, automated deletion cascades, CI/CD, and a formal requirements baseline.

Known contract limitation: `InquiryWizardPage.jsx` sends a flat payload while `createInquiry` expects nested `customer`/`product`; that flow does not match the implemented API.
