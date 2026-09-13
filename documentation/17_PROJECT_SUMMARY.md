# Executive Project Summary

CureNeed (MedCare) is a three-part web platform for presenting a medicine catalogue and collecting customer enquiries. Customers use a public website to browse medicines, select product options, and submit an enquiry or general contact message. Staff use a separate protected administration application to manage products and categories, review enquiries and messages, and—when they are super administrators—manage administrator accounts.

The platform is built with React frontends and an Express/MongoDB backend. Administrative access uses password hashing, JWT cookies, account lockout, roles and permissions. The backend includes practical protections such as CORS controls, HTTP security headers, rate limiting, structured log redaction, and input validation. Images are integrated with Cloudinary; new enquiries can notify staff through Resend email and optionally Twilio WhatsApp. Docker definitions package the three applications for deployment.

The product is intentionally an enquiry system rather than an e-commerce checkout. Payment, cart, customer account, and order-history features are **Not Implemented**. The API contains an order endpoint, but the public interface does not call it.

Operationally, the catalogue can fall back to local JSON data if MongoDB is unavailable. This supports basic browsing continuity, while full administrative operations and durable lead storage depend on MongoDB. Actual production hosting, domain, monitoring, backups, and CI/CD are **Not Implemented / not identifiable** from the repository.

Before an agency handover or production expansion, the most important implementation issues to resolve are the inquiry wizard/API payload mismatch, missing admin permissions-update endpoint, and absent permissions in the current-session API response. These are documented as current-state findings, not changes made by this documentation deliverable.
