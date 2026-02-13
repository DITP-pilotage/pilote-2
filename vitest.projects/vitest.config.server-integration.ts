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
      './vitest.setup.server.ts',
      './src/server/infrastructure/test/integrationTestSetup.ts',
    ],
    pool: 'forks',
    fileParallelism: false,
    globals: true,
  },
  ssr: {
    noExternal: ['next-auth'],
  },
});
