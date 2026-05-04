import { fileURLToPath, URL } from 'node:url'

import devServer from '@hono/vite-dev-server'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  server: {
    // Vite désactivé pour laisser Hono gérer CORS (cookies httpOnly + Lax,
    // headers de sécurité). Sans ça, Vite réécrit les headers en dev.
    cors: false,
  },
  plugins: [
    // tanstackRouter DOIT être avant react()
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    devServer({
      entry: 'src/server/app.ts',
      export: 'app',
      exclude: [
        /^\/@.+$/,
        /.*\.(ts|tsx|js|jsx|css|svg|png|jpg|jpeg|gif|webp|woff2?)($|\?)/,
        /^\/(public|assets|static)\/.+/,
        /^\/node_modules\/.*/,
        /^\/src\/.+/,
        /^\/$/,
        /^\/index\.html$/,
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    css: true,
  },
})
