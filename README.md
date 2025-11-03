# MedCare – Modern Pharmacy Landing (React + Vite)

MedCare is a responsive, single‑page pharmacy storefront built with React 19, Vite, and Tailwind CSS. It showcases a clean, accessible UI with a hero banner, category browsing, featured products, and a polished footer — ideal as a starting point for an online pharmacy or healthcare e‑commerce experience.

> This README documents the actual implementation in this repo. It replaces the default Vite template docs.

## Features

- Responsive layout optimized for mobile → desktop
- Navbar with search, category links, currency toggle, and cart icon
- Hero section with branded background image and gradient overlay for legibility
- “Shop by Category” grid with interactive cards
- Featured Medicines grid with product cards and clear CTAs
- Informational footer with feature highlights and quick links
- Modern styling via Tailwind CSS v4 (using the official Vite plugin)
- Strict ESLint config and React Fast Refresh for a smooth DX

## Tech stack

- React 19
- Vite 7
- Tailwind CSS 4 (via `@tailwindcss/vite` plugin)
- ESLint 9

Minimum Node.js version: 18+ (LTS recommended)

## Getting started

From a terminal in the project root:

```powershell
# install deps
npm install

# start dev server on http://localhost:5173/
npm run dev

# build for production (outputs to dist/)
npm run build

# locally preview the production build
npm run preview

# lint the project
npm run lint
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

## Accessibility notes

- High‑contrast text over imagery using a left‑to‑right white gradient overlay in the hero
- Focus states are present on interactive elements
- Logical heading structure across sections
- Descriptive button labels; images use meaningful `alt` text

## Available scripts

These are defined in `package.json`:

- `npm run dev` – start the dev server with React Fast Refresh
- `npm run build` – production build to `dist/`
- `npm run preview` – preview the production build locally
- `npm run lint` – run ESLint on the project

## Components overview

- `Navbar.jsx` – brand, search, navigation, currency, and cart
- `Hero.jsx` – promotional banner with image background and CTA buttons
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
This PR replaces the template README with comprehensive documentation for MedCare.

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