import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      includeAssets: ['world.svg', 'logo.glb'],
      manifest: {
        name: 'TOXI Media',
        short_name: 'TOXIMedia',
        description: 'Digital Ocean Three.js Scene',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        earth: resolve(__dirname, 'earth.html'),
        line: resolve(__dirname, 'line.html'),
        point: resolve(__dirname, 'point.html'),
      },
    },
  },
});

