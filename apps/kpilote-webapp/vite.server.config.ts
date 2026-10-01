import { defineConfig } from 'vite'

export default defineConfig({
  ssr: {
    // Package du workspace exposé en sources TypeScript : à bundler.
    noExternal: ['@pilote/kpilote-acme'],
  },
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
