import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    sequence: { concurrent: true },
    pool: 'threads',
    poolOptions: { threads: { maxThreads: 10 } },
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@/framework': resolve(__dirname, 'src/framework'),
      '@/authentication': resolve(__dirname, 'src/authentication'),
      '@/healthcheck': resolve(__dirname, 'src/healthcheck'),
      '@/test': resolve(__dirname, 'src/test'),
      '@/config': resolve(__dirname, 'src/config'),
    },
  },
})
