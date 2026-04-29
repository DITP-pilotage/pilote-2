import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    sequence: { concurrent: true },
    pool: 'threads',
    maxWorkers: 10,
    testTimeout: 30_000,
  },
})
