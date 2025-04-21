import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
      },
      manifest: {
        name: 'Phrasebook',
        short_name: 'Phrasebook',
        description: 'Your personal phrasebook for learning languages',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/phrasebook/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/phrasebook/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  base: '/phrasebook/',
})