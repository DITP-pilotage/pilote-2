import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

export default defineProject({
  plugins: [tsconfigPaths()],
  test: {
    name: "server-unit",
    root: "./",
    environment: "node",
    include: [
      "src/server/**/*.unit.test.{ts,tsx}",
      "scripts/**/*.unit.test.{ts,tsx}",
      // src/validation/ n'etait couvert par AUCUN projet vitest : ses 21 fichiers de
      // schemas etaient structurellement intestables.
      "src/validation/**/*.unit.test.{ts,tsx}",
    ],
    setupFiles: ["./vitest.setup.server.ts"],
    globals: true,
  },
});
