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
        // Keep deploy-critical bundles under predictable filenames. Vite's
        // default content hashes create new untracked files on every change,
        // which makes it easy to commit index.html without the referenced
        // JavaScript or stylesheet.
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith('.css')
            ? 'assets/index.css'
            : 'assets/[name]-[hash][extname]',
      },
    },
  },
})
