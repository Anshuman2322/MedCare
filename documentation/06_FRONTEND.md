# Frontend Documentation

## Structure

| Location | Purpose |
|---|---|
| `client/src/pages` | Public route views: shop, details, inquiry, contact, about/legal pages |
| `client/src/components` | Shared shell/UI; `category`, `product`, `inquiry`, `common` feature groups |
| `client/src/api`, `services` | Native-fetch medicine and inquiry calls |
| `client/src/store` | Currency React Context |
| `client/src/utils` | price/image/wishlist/content-protection/animation helpers |
| `admin/src/pages` | Login and protected management pages |
| `admin/src/components` | Protected route, layout, UI primitives, image uploader |
| `admin/src/context` | Authentication context |
| `admin/src/api` | Axios API modules |

## Routing and state

The storefront uses `BrowserRouter`/`Routes` in `client/src/App.jsx`; routes are public and share Navbar/Footer. Admin uses `createBrowserRouter` in `admin/src/App.jsx`, with protected nested routes under `AdminLayout`. `AuthProvider` restores the cookie session using `/api/auth/me`. Client state is primarily local hooks. Shared state is CurrencyContext; wishlist/theme helpers use localStorage. Redux, Zustand, React Query, global error boundary, and server-side rendering are **Not Implemented**.

## Components/pages/hooks/utilities

Reusable storefront components include Navbar, Footer, Hero, cards/carousels, category UI, `InquiryModal`, wizard steps, and image placeholder. Admin reuses layout/Modal/Badge/StatCard/ImageUploader. `useCurrency`, `useDarkMode`, and `useScrollAnimation` are custom hooks; `useDarkMode` has no observed consumer. Utilities normalize images/prices, format fixed currency rates, and store wishlist values.

## API integration/error/loading

Storefront API wrappers use `VITE_API_URL` plus `fetch`; admin Axios uses the same variable and `withCredentials: true`. Components/pages manage `loading`, `submitting`, and inline error strings locally. There are no retries, cache invalidation layer, interceptors, global notifications, or API contract types. ImageUploader posts browser FormData directly to Cloudinary unsigned upload.

## Styling/performance

Client uses Tailwind v4 and CSS files; admin uses Tailwind v3/PostCSS. Vite builds both; Nginx caches hashed `/assets` indefinitely. Images use lazy loading in some product/detail views. Bundle analysis, image optimization pipeline beyond Cloudinary endpoint options, accessibility audit, and performance budgets are **Not Implemented**.

## Known frontend contract issues

- `/api/auth/me` omits permissions although non-super admin route/sidebar checks expect them.
- Admin permission-save endpoint is called but absent from API.
- Inquiry wizard flat request does not match backend nested request contract.
