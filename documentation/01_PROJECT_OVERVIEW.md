# Project Overview

## Project summary

MedCare, branded **CureNeed** in the UI, is a medicine catalogue and inquiry platform. It comprises a public storefront (`client/`), a separate administration SPA (`admin/`), and an Express/MongoDB API (`server/`). It is not a payment or checkout application.

## Business problem and solution

The implementation addresses publishing a medicine catalogue, collecting customer enquiries, and allowing staff to manage products, categories, enquiries, messages, and administrators. Public visitors browse and submit a medicine enquiry or contact message; authenticated administrators manage the operational data.

## Target users

- Visitors/customers: browse products, view details, submit enquiries/contact messages.
- Administrators: manage medicines/categories and review leads/messages.
- Super administrators: additionally create/delete admins and transfer/change ownership roles.

## Applications and features

| Application | Features | Evidence |
|---|---|---|
| Public storefront | Home, shop/filtering, product details, inquiry modal/wizard, contact, legal pages, local wishlist/currency | `client/src/App.jsx`, `pages/`, `components/` |
| Admin SPA | Cookie login, dashboard, medicine/category management, inbound inquiry/message views, admin management | `admin/src/App.jsx`, `pages/` |
| API | REST resources, admin auth/authorization, MongoDB persistence, uploads, notifications | `server/app.js`, `routes/`, `controllers/` |

## Technology stack

React/Vite/Tailwind power both SPAs. Express, Mongoose/MongoDB, JWT, bcrypt, Pino, Cloudinary, Resend, and optional Twilio power the server. See [03_ARCHITECTURE.md](03_ARCHITECTURE.md) for versions and placement.

## Goals actually represented by code

- Present a searchable medicine catalogue.
- Capture inquiry/contact leads rather than payment orders.
- Provide role-protected back-office maintenance.
- Keep public catalogue reads available using JSON fallback when MongoDB is unavailable.

## Future scope

Not Implemented: a committed product roadmap. The code does not implement customer accounts, cart/checkout/payment, a customer order history, refresh tokens, CI/CD, or a named cloud deployment.
