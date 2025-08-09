import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import packageJson from './package.json'

export default defineConfig(() => {
  // Load environment variables
  const basePath = process.env.VITE_BASE_PATH || process.env.PUBLIC_BASE_PATH || '/'
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001/api'
  
  return {
    // Set base path for deployment
    base: basePath,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          clientsClaim: true,
          skipWaiting: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon-96x96.png', 'web-app-manifest-192x192.png', 'web-app-manifest-512x512.png'],
        manifest: {
          name: 'Recipix - Financial Receipt Processor',
          short_name: 'Recipix',
          description: 'Capture and process receipts for financial systems',
          theme_color: '#3b82f6',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: basePath,
          start_url: basePath,
          icons: [
            {
              src: 'favicon.ico',
              sizes: '16x16 32x32 48x48',
              type: 'image/x-icon'
            },
            {
              src: 'favicon-96x96.png',
              sizes: '96x96',
              type: 'image/png'
            },
            {
              src: 'web-app-manifest-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'web-app-manifest-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
      }
    })
  ],
  define: {
      // Inject version and configuration at build time
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __APP_NAME__: JSON.stringify(packageJson.name),
      __API_BASE_URL__: JSON.stringify(apiBaseUrl),
      __BASE_PATH__: JSON.stringify(basePath),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  }
})
