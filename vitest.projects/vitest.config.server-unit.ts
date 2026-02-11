import tsconfigPaths from 'vite-tsconfig-paths';
import { defineProject } from 'vitest/config';

export default defineProject({
  plugins: [tsconfigPaths()],
  test: {
    name: 'server-unit',
    root: './',
    environment: 'node',
    include: [
      'src/server/**/*.unit.test.{ts,tsx}',
      'scripts/**/*.unit.test.{ts,tsx}',
    ],
    setupFiles: ['./vitest.setup.server.ts'],
    globals: true,
  },
});
