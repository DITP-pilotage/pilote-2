import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["acme-proxy/**/*.test.ts"],
    environment: "node",
  },
});
