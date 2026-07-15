import { fileURLToPath, URL } from 'node:url'

import devServer from '@hono/vite-dev-server'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  server: { cors: false },
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    devServer({
      entry: 'src/server/app.ts',
      export: 'app',
      exclude: [
        /^\/@.+$/,
        /.*\.(ts|tsx|js|jsx|css|svg|png|jpg|jpeg|gif|webp|woff2?)($|\?)/,
        /^\/(public|assets|static|src|node_modules)\/.+/,
        /^\/(?!auth(\/|$)|healthz(\/|$)|api(\/|$)|console(\/|$)).*/,
      ],
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { outDir: 'dist/client', emptyOutDir: true },
})
