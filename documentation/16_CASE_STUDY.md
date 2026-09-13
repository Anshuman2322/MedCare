# Case Study: CureNeed Medicine Catalogue and Inquiry Platform

## Client problem

The delivered implementation supports a business that needs to publish a medicine catalogue and receive product enquiries while giving staff a controlled administrative workspace. It is designed around enquiry follow-up rather than online payment.

## Research and solution

No user research artefacts, client identity, market research, analytics results, or discovery record were found; therefore they are **Not Implemented / not identifiable**. The implemented solution is a responsive public React catalogue plus a separate admin SPA backed by a secured Express/MongoDB API.

## Architecture

Visitors use React/Vite storefront routes to request public medicine data. Admins authenticate through a cookie JWT and operate protected React routes. Express applies middleware and controllers persist documents with Mongoose. Cloudinary supplies images; new enquiries optionally notify by Resend and Twilio. Docker/Nginx package the web applications.

## Challenges addressed in code

- Maintaining public catalogue availability when MongoDB is unavailable using local JSON fallback.
- Managing product variants and rich medicine data.
- Protecting administrative functions with roles/permissions, lockout, rate limits, CORS, and HTTP security headers.
- Providing operational lead messages and optional external notifications.

## Screenshots

**Placeholder — Not Included.** Suggested captures: public home/shop/detail/inquiry; admin login/dashboard/catalog/inquiries/messages; Docker deployment diagram.

## Results and lessons

Measured business results, conversion data, performance benchmarks, and client testimonial are **Not Implemented / not available**. Engineering lessons visible in code: separating public/admin UIs is valuable; JSON fallback improves read availability but is not a substitute for persistent storage; contracts must stay synchronized—current inquiry and permission mismatches demonstrate this.

## Technology stack

React, Vite, Tailwind, Express, MongoDB/Mongoose, JWT, bcrypt, Cloudinary, Resend, Twilio, Docker, Nginx, Jest/Vitest/Playwright.
