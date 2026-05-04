import devServer from '@hono/vite-dev-server'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    // Vite désactivé pour ne pas écraser les headers CORS posés par Hono
    // (credentials, allowed origins). Le middleware Hono gère le CORS seul.
    cors: false,
  },
  ssr: {
    noExternal: ['@pilote/mb-shared'],
  },
  build: {
    target: 'node24',
    ssr: 'src/index.ts',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        format: 'esm',
      },
    },
  },
  plugins: [devServer({ entry: 'src/app.ts', export: 'app' })],
})
