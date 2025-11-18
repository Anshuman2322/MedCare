import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use a distinct port and strictPort to avoid conflicts
const PORT = 5175;

export default defineConfig({
  // Reuse root project's public assets (e.g., /logo.png) for consistent branding
  // This exposes files under MedCare/public at the admin dev server root
  publicDir: '../public',
  server: {
    port: PORT,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: PORT
    },
    proxy: {
      '/api': 'http://localhost:5050',
      '/medicines': 'http://localhost:5050'
    }
  },
  plugins: [react()]
});
