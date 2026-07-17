import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Vite config tuned for Capacitor Android packaging.
// Key: `base: './'` emits relative asset paths so the built JS/CSS loads
// correctly under the WebView's `https://localhost` or `file://` scheme.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline', // مدمج مباشرة لتجنب مشاكل المسارات في الأندرويد
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,jpg,jpeg,ico}'], // تضمين كافة الصور محلياً بكاش السيرفر
        navigateFallback: null // تعطيل التوجيه الخارجي لمنع الشاشة السوداء عند عدم وجود إنترنت
      }
    })
  ],
  build: {
    outDir: 'dist',
    target: 'es2019',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          pixi: ['pixi.js'],
          react: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  server: {
    host: true
  }
})
