import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      "./vitest.projects/vitest.config.server-integration.ts",
      "./vitest.projects/vitest.config.server-unit.ts",
      "./vitest.projects/vitest.config.client.ts",
    ],
  },
});
