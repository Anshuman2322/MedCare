# CureNeed – Advanced Healthcare E-Commerce Platform

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.16-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

CureNeed is a comprehensive, responsive healthcare e-commerce platform built with cutting-edge technologies. Featuring real-time currency conversion, advanced search functionality, IndiaMART certifications, and a polished user experience optimized for pharmaceutical and medical product sales.

## Key Features

### **E-Commerce Functionality**
- **Product Catalog**: 61+ medicines with detailed information and images
- **Category Browsing**: Organized shop-by-category with product counts
- **Advanced Search**: Real-time search with dropdown suggestions and navigation
- **Product Details**: Comprehensive medicine details with pricing and availability

### **Multi-Currency Support**
- **7 Currencies**: USD, EUR, GBP, INR, CAD, AUD, JPY
- **Live Exchange Rates**: Real-time conversion with current market rates
- **Persistent Selection**: Currency preference saved locally
- **Global Context**: Seamless currency switching across all pages

### **Trust & Certifications**
- **IndiaMART Verified**: Official Trust Seal and Verified Exporter badges
- **FDA Approved**: Healthcare compliance certifications
- **WHO Compliant**: International quality standards
- **Professional Credibility**: Dedicated certification showcase section

### **Modern User Experience**
- **Responsive Design**: Mobile-first approach with breakpoint optimization
- **Smooth Animations**: Scroll-triggered animations and hover effects
- **Fast Performance**: Vite-powered with React 19 optimizations
- **Accessibility**: WCAG compliant with proper focus management

## Recent Updates

- Rebranded the site to **CureNeed** across all pages and configs
- Navbar now uses your brand logo from `/public/logo.png` and the favicon also points to this file
- Hero section uses a high‑quality background video at `/public/video/medicine.mp4` with an image poster fallback
- Featured Medicines now loads 6 real items from `src/data/medicines.json` and includes a “View More” button to `/shop`
- Unified, global `Footer` rendered on every page for consistent branding
- About page enhancements: much larger team photo and a Business Details section with GST highlight + copy button
- Admin UX: Added an "Update Success" modal after saving a medicine; the primary action is labeled "Yes, Update" to return to the list
- Admin UX: Replaced native browser alerts with in‑app toast notifications for validation and errors
- Main Site: Added content protection (blocks right‑click, copy/cut, drag, and common devtools shortcuts) – see "Content Protection" below

## Tech Stack

### **Core Technologies**
- ![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react) **React 19.1.1** - Latest React with Concurrent Features
- ![Vite](https://img.shields.io/badge/Vite-7.9.5-646CFF?logo=vite) **Vite 7.9.5** - Lightning-fast build tool and dev server
- ![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-4.1.16-06B6D4?logo=tailwindcss) **Tailwind CSS 4.1.16** - Utility-first CSS framework
- ![React Router](https://img.shields.io/badge/React%20Router-7.9.5-CA4245?logo=reactrouter) **React Router 7.9.5** - Client-side routing

### **Development Tools**
- ![ESLint](https://img.shields.io/badge/ESLint-9.x-4B32C3?logo=eslint) **ESLint 9** - Code linting and quality
- ![JavaScript](https://img.shields.io/badge/JavaScript-ES2024-F7DF1E?logo=javascript) **Modern JavaScript** - ES2024 features
- ![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs) **Node.js 18+** - Runtime environment

### **Architecture Patterns**
- **Context API** - Global state management for currency
- **Custom Hooks** - Reusable logic for animations and state
- **Component Composition** - Modular and maintainable code structure
- **Responsive Design** - Mobile-first with progressive enhancement

**System Requirements**: Node.js 18+ (LTS recommended), Windows/macOS/Linux

## Quick Start

### **Prerequisites**
```bash
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
```

### **Installation**
```bash
# Clone the repository
git clone https://github.com/hardik-ajmeriya/MedCare.git
cd MedCare

# Install dependencies
npm install

# Start development server
npm run dev
# → Opens http://localhost:5173/
```

### **Available Scripts**
```bash
# Development
npm run dev          # Start dev server with HMR

# Production
npm run build        # Build for production → dist/
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint
```

### **Environment Setup**
Create a `.env.local` file for local development:
```env
VITE_API_BASE=http://localhost:5050/api
VITE_CURRENCY_API_KEY=your_api_key_here
VITE_ANALYTICS_ID=your_analytics_id
```
Backend (optional) environment:
```env
# Override the path to the medicines JSON used by the API
# Defaults to ./src/data/medicines.json at repo root
DATA_JSON_PATH=src/data/medicines.json
```

## Project structure

```
MedCare/
├─ public/                # Static assets copied as‑is
├─ src/
│  ├─ assets/             # Images used by components
│  ├─ components/         # UI sections
│  │  ├─ Navbar.jsx
│  │  ├─ Hero.jsx
│  │  ├─ CategorySection.jsx
│  │  ├─ FeaturedMedicines.jsx
│  │  └─ Footer.jsx
│  ├─ data/               # Domain data (placeholder)
│  ├─ store/              # Global state hooks (placeholder)
│  ├─ utils/              # Utilities (e.g., currency)
│  ├─ App.jsx             # Composition of page sections
│  ├─ App.css             # Component‑level styles (light usage)
│  ├─ index.css           # Global styles + Tailwind entry
│  └─ main.jsx            # App entry
├─ index.html             # Vite HTML template
├─ vite.config.js         # Vite + Tailwind plugin config
├─ eslint.config.js       # ESLint 9 config for React
└─ package.json
```

## Styling

- Tailwind v4 is enabled via the official Vite plugin (`@tailwindcss/vite`). No additional Tailwind config is required for common usage.
- The base font is Inter (loaded in `src/index.css`).
- Utility‑first classes provide consistent sizing, spacing, and color. Light custom CSS is used to reset defaults and improve rendering.

### Branding & Content

- Replace the logo at `/public/logo.png` to update the brand everywhere (Navbar + favicon)
- Hero background video path: `/public/video/medicine.mp4` (configured in `src/components/Hero.jsx`); poster image: `src/assets/hero-pharmacy.jpg`
- Navbar logo sizing is controlled in `src/components/Navbar.jsx` via Tailwind classes (default `h-10 sm:h-12`)
- Business details shown on the About page (`src/pages/About.jsx`) can be edited inside `BusinessDetailsSection`

## Accessibility notes

- High‑contrast text over imagery using a left‑to‑right white gradient overlay in the hero
- Focus states are present on interactive elements
- Logical heading structure across sections
- Descriptive button labels; images use meaningful `alt` text

## Components overview

- `Navbar.jsx` – brand, search, navigation, currency, and cart
- `Hero.jsx` – promotional banner with video background and CTA buttons
- `CategorySection.jsx` – grid of category cards with counts
- `FeaturedMedicines.jsx` – product cards with price and CTA
- `Footer.jsx` – feature highlights and resource links

## Development tips

- Images live in `src/assets/`. Add new assets alongside existing ones and import them in components.
- Use `utils/currency.js` for formatting money values if you start wiring real data.
- `store/useStore.js` is a placeholder for global state (e.g., a cart) should you expand functionality.

## Deployment

1. Build: `npm run build`
2. Deploy the `dist/` directory to your host (e.g., GitHub Pages, Netlify, Vercel, or any static host).

## Admin Dashboard & API

- Backend (ESM, Node/Express) lives in `backend/` and serves APIs at `http://localhost:5050/api`.
- Admin dashboard (React + Vite + Tailwind) lives in `admin/` on `http://localhost:5174` by default.
- Both integrate with the main site using the SAME data and images:
	- JSON: `src/data/medicines.json`
	- Images root: `public/medicines/` (stored on disk as `public/medicines/<id>/<n>.jpg`)
- Image URLs written to JSON follow the main site’s existing flat pattern: `/medicines/<id>/<n>.jpg`.

### Run locally (Windows PowerShell)

```powershell
# Backend API
Set-Location "s:\MedCare\backend"; npm install; npm run dev

# Admin dashboard (in a new terminal)
Set-Location "s:\MedCare\admin"; npm install; npm run dev
```

Key endpoints:
- `GET /api/categories` – list allowed categories
- `GET /api/medicines` – list all medicines
- `GET /api/medicines?deleted=true` – list soft‑deleted medicines (Recycle Bin)
- `POST /api/medicines` – create medicine (multipart, field: images[])
- `PUT /api/medicines/:id` – update medicine (supports additional images)
- `DELETE /api/medicines/:id` – delete medicine and its folder
- `POST /api/medicines/:id/images` – add images (multipart)
- `DELETE /api/medicines/:id/images` – remove one image `{ url }`
- `PUT /api/medicines/:id/restore` – restore a soft‑deleted medicine
- `POST /api/medicines/purge` – permanently delete items deleted more than 7 days ago
- `PUT /api/medicines/:id/images/order` – reorder a medicine’s images `{ order: string[] }`

Allowed categories (validated): Antibiotics, Anti-Cancer, Anti-Malarial, Anti-Viral, Chronic-Cardiac, ED, Hormones-Steroids, Injections, Pain-Killers, Skin-Allergy-Asthma, Supplements-Vitamins-Hair.

Notes:
- Requests that modify images use multipart form data with `images` as the field name.
- `details` can be provided as a JSON string array of `{ label, value }`. The backend normalizes predefined fields (Brand Name, Manufacturer, Strength, Composition, Form, Pack Size, Packaging Type, Tablets in a Strip, Shelf Life, Category, Medicine Type, Storage).
- When renaming (changing `name`), the backend will attempt to move the image folder from `/public/medicines/<oldId>` to `/public/medicines/<newId>` and update image URLs accordingly.

### Content Protection

The main site includes light content‑protection to deter casual copying and asset downloads:
- Blocks right‑click, copy/cut, drag, and common devtools shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U/S/P)
- Disables image context menus and dragging; sets `controlsList="nodownload"` on media
- Text selection is disabled by default but allowed for inputs/textareas/selects and elements with `.allow-select`

Disable temporarily (for development/troubleshooting):
- Comment out the `enableContentProtection()` call in `src/main.jsx` and remove `oncontextmenu="return false"` on `<body>` in `index.html`

## Contributing

Branch naming convention: `feature/<short-description>` or `fix/<short-description>`

Basic flow:

1. Create a branch from `main`
2. Commit with conventional messages (e.g., `feat: add cart badge to navbar`)
3. Push and open a Pull Request to `main`

### Suggested PR title/body

Title:

```
docs: rewrite README with project overview, setup, and usage
```

Body:

```
This PR replaces the template README with comprehensive documentation for CureNeed.

Changes
- Add project overview and feature list
- Document tech stack and scripts
- Provide setup, build, and deployment instructions (Windows-friendly)
- Describe project structure, components, and styling approach
- Add accessibility notes, contributing guide, and FAQ

Why
- Make the repo understandable to new contributors and future maintainers
```

## FAQ

• “Why didn’t my updated README show on GitHub?” – The repository homepage shows the README from the default branch (usually `main`). If you pushed changes to a feature branch, open a PR and merge it into `main` to update the homepage.

## Author
• Anshuman Singh
• Hardik Ajmeriya

## License

No license has been declared yet. If you plan to open‑source this project, add a license (e.g., MIT) at the repository root.

---

Made with ❤️ using React, Vite, and Tailwind CSS.