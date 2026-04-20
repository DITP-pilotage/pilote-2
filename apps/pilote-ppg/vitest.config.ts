import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    projects: [
      './vitest.projects/vitest.config.server-integration.ts',
      './vitest.projects/vitest.config.server-unit.ts',
      './vitest.projects/vitest.config.client.ts',
    ],
  },
});
