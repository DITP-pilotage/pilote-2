import tsconfigPaths from 'vite-tsconfig-paths';
import { defineProject } from 'vitest/config';

export default defineProject({
  plugins: [tsconfigPaths()],
  test: {
    name: 'server-integration',
    root: './',
    environment: 'node',
    include: ['src/server/**/*.integration.test.{ts,tsx}'],
    setupFiles: [
      './src/server/infrastructure/test/integrationTestSetup.ts',
      './vitest.setup.server.ts',
    ],
    pool: 'forks',
    singleFork: true,
    fileParallelism: false,
    globals: true,
  },
  ssr: {
    noExternal: ['next-auth'],
  },
});
