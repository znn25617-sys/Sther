import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config tuned for Capacitor Android packaging.
// Key: `base: './'` emits relative asset paths so the built JS/CSS loads
// correctly under the WebView's `https://localhost` or `file://` scheme.
// Absolute paths (base: '/') fail inside a Capacitor WebView and produce a
// black screen because the assets resolve to the device root, not the app.
export default defineConfig({
  base: './',
  plugins: [react()],
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
