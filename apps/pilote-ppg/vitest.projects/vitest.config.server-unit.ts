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
      "src/utils/**/*.unit.test.{ts,tsx}",
      // Les helpers d'eval sont testes a cote du code qu'ils testent, plutot
      // que sous src/ avec un chemin relatif a quatre niveaux.
      "evals/**/*.unit.test.ts",
    ],
    setupFiles: ["./vitest.setup.server.ts"],
    globals: true,
  },
});
