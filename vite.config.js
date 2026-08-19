import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true
  },
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,glb,mp3,otf}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024
      },
      includeAssets: ['world.svg', 'logo.glb'],
      manifest: {
        name: 'TOXI Media',
        short_name: 'TOXIMedia',
        description: 'Digital Ocean Three.js Scene',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait',
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
        index: resolve(__dirname, 'index.html'),
        main: resolve(__dirname, 'main.html'),
        earth: resolve(__dirname, 'earth.html'),
        line: resolve(__dirname, 'line.html'),
        point: resolve(__dirname, 'point.html'),
        app: resolve(__dirname, 'app.html'),
        hotelOriente: resolve(__dirname, 'hotel-oriente.html'),
        detectiveNoir: resolve(__dirname, 'detective-noir.html'),
        hedonismoYSeduccion: resolve(__dirname, 'hedonismo-y-seduccion.html'),
        university: resolve(__dirname, 'university.html'),
        plantform: resolve(__dirname, 'plantform.html'),
        tv: resolve(__dirname, 'tv.html'),
        zapping: resolve(__dirname, 'zapping.html'),
        privacyPolicy: resolve(__dirname, 'privacy-policy.html'),
        venadoTuertoElMusical: resolve(__dirname, 'venado-tuerto-el-musical.html'),
        trabajos: resolve(__dirname, 'trabajos.html'),
        notaConstante: resolve(__dirname, 'nota-constante.html'),
        otroDiaEnLaRed: resolve(__dirname, 'otro-dia-en-la-red.html'),
        audiont: resolve(__dirname, 'audiont.html'),
        radio: resolve(__dirname, 'radio.html'),
        wiki: resolve(__dirname, 'wiki.html'),
        onboarding: resolve(__dirname, 'onboarding.html'),
        matriz: resolve(__dirname, 'matriz.html'),
        xploraNightLive: resolve(__dirname, 'xplora-night-live.html'),
        xploraNightLiveOverlayCountdown: resolve(__dirname, 'xplora-night-live-overlay-countdown.html'),
        mersVlog: resolve(__dirname, 'mers-vlog.html'),
        mersVlogCast: resolve(__dirname, 'mers-vlog-cast.html'),
        vr: resolve(__dirname, 'vr.html'),
        reporteXimena: resolve(__dirname, 'reporte-ximena.html'),
        schedule: resolve(__dirname, 'schedule.html'),
        turingAdmin: resolve(__dirname, 'turing-admin.html'),
        turing: resolve(__dirname, 'turing.html'),
        weWillRockYou: resolve(__dirname, 'we-will-rock-you.html'),
      },
    },
  },
});

