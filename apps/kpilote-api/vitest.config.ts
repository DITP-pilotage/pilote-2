import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    // Les tests qui appellent Albert ont leur propre configuration (`pnpm test:albert`).
    exclude: [...configDefaults.exclude, '**/*.albert.test.ts'],
    sequence: { concurrent: true },
    clearMocks: false,
    pool: 'forks',
    maxWorkers: 10,
    testTimeout: 30_000,
    globalSetup: ['./src/test/globalSetup.ts'],
  },
})
