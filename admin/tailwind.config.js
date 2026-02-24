/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Manrope"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#ecfdf3',
          100: '#d1fae2',
          200: '#a7f3c8',
          300: '#6ee7ac',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      boxShadow: {
        card: '0 18px 40px -24px rgba(4, 120, 87, 0.35)',
      },
    },
  },
  plugins: [],
};
