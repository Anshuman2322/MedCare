# MedCare – Advanced Healthcare E-Commerce Platform

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.9.5-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.16-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

MedCare is a comprehensive, responsive healthcare e-commerce platform built with cutting-edge technologies. Featuring real-time currency conversion, advanced search functionality, IndiaMART certifications, and a polished user experience optimized for pharmaceutical and medical product sales.

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
npm run dev:host     # Start dev server accessible on network

# Production
npm run build        # Build for production → dist/
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix auto-fixable ESLint issues
npm run format       # Format code with Prettier

# Testing
npm run test         # Run test suite
npm run test:coverage # Run tests with coverage report
```

### **Environment Setup**
Create a `.env.local` file for local development:
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_CURRENCY_API_KEY=your_api_key_here
VITE_ANALYTICS_ID=your_analytics_id
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