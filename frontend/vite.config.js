import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import os from 'node:os'
import path from 'node:path'

const disposableBuildDir = path.join(os.tmpdir(), 'pineneedledesigns-frontend-dist')

export default defineConfig({
  plugins: [vue()],
  base: '/',
  server: {
    host: '127.0.0.1',
    port: Number(process.env.VITE_PORT || 5203),
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Verification builds are disposable and must stay outside the Dropbox-backed
    // repository. Release builds explicitly copy this completed output into docs.
    outDir: process.env.PINE_BUILD_OUT_DIR || disposableBuildDir,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
})
