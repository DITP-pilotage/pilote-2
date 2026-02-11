import tsconfigPaths from 'vite-tsconfig-paths';
import { defineProject } from 'vitest/config';

export default defineProject({
  plugins: [tsconfigPaths()],
  test: {
    name: 'server-integration',
    root: './',
    environment: 'node',
    include: ['src/server/**/__tests__/**/*.integration.test.{ts,tsx}'],
    setupFiles: [
      './tests/integrationTestSetup.ts',
      './vitest.setup.server.ts',
    ],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    envFile: '.env.test',
    globals: true,
  },
});
