import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'docs',
    rollupOptions: {
      output: {
        // Keep the main bundle tracked under one predictable filename. Vite's
        // default content hash creates a new untracked file on every change,
        // which makes it easy to commit index.html without its new bundle.
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
})
