/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Offline support: precache the app, fonts and the piano samples (npm run setup).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'samples/piano/*.mp3', 'samples/piano/manifest.json'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2,mp3,json}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'EarLab — phòng luyện tai',
        short_name: 'EarLab',
        description: 'Local ear-training studio',
        theme_color: '#0e1014',
        background_color: '#0e1014',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  server: { port: 5173 },
  // Served from localhost, so one ~700 kB bundle (mostly Tone.js) is fine.
  build: { chunkSizeWarningLimit: 1000 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
