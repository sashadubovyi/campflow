import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: '&u — Plans made easy',
        short_name: '&u',
        description: 'Спільне планування подій: кімнати, голосування, фінальний план',
        lang: 'uk',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5f6fa',
        theme_color: '#4f8ef7',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Кімнати', url: '/rooms', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
          { name: 'Чати', url: '/chats', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // SPA-fallback не повинен перехоплювати API/WS/медіа
        navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io\//, /^\/uploads\//],
        runtimeCaching: [
          {
            // Останні повідомлення кімнат і DM — читаються офлайн з кешу,
            // онлайн завжди свіжі (NetworkFirst з коротким таймаутом).
            urlPattern: /\/api\/(rooms\/[^/]+|dm\/[^/]+)\/messages/,
            method: 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'chat-history',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Списки кімнат/чатів для офлайн-шелу
            urlPattern: /\/api\/(rooms|dm)$/,
            method: 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-lists',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 10, maxAgeSeconds: 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // OSM-тайли мапи: повільні й незмінні — CacheFirst
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
