import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'node24',
    ssr: 'src/server/index.ts',
    outDir: 'dist/server',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        format: 'esm',
      },
    },
  },
})
