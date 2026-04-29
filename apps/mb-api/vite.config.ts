import devServer from '@hono/vite-dev-server'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
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
