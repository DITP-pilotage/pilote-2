import { defineConfig } from 'vitest/config'

// Tests qui appellent réellement Albert : hors de `pnpm test`, lancés par
// `pnpm test:albert`. Ils sont lents et limités par le débit d'Albert, donc
// joués un fichier à la fois, sans base de données.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ['src/**/*.albert.test.ts'],
    setupFiles: ['./src/test/albertSetup.ts'],
    fileParallelism: false,
    testTimeout: 300_000,
  },
})
