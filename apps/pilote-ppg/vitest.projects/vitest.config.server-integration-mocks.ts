import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

import { FICHIERS_INTEGRATION_AVEC_MOCKS_DE_MODULE } from "./fichiersIntegrationAvecMocksDeModule";

/**
 * Jumeau de `server-integration`, mais avec l'isolation par fichier conservee.
 *
 * `vi.mock` ne peut remplacer un module que si le registre de modules est neuf :
 * sous `isolate: false`, un module deja importe par un fichier precedent reste
 * celui qui est resolu, le mock ne s'applique pas et le test part sur le vrai
 * appel reseau. Les rares fichiers qui mockent un module vivent donc ici.
 */
export default defineProject({
  plugins: [tsconfigPaths()],
  test: {
    name: "server-integration-mocks",
    root: "./",
    environment: "node",
    include: FICHIERS_INTEGRATION_AVEC_MOCKS_DE_MODULE,
    setupFiles: [
      "./vitest.setup.server.ts",
      "./src/server/infrastructure/test/integrationTestSetup.ts",
    ],
    pool: "forks",
    fileParallelism: false,
    // vitest refuse que deux projets aient un `maxWorkers` different et le meme
    // `groupOrder`. `fileParallelism: false` force maxWorkers a 1 ici, la ou les
    // projets unitaires gardent le defaut : il faut donc un ordre distinct, qui
    // fait au passage tourner l'integration apres les tests unitaires.
    sequence: { groupOrder: 2 },
    globals: true,
  },
  ssr: {
    noExternal: ["next-auth"],
  },
});
