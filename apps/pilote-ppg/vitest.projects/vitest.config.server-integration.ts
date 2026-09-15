import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

import { FICHIERS_INTEGRATION_AVEC_MOCKS_DE_MODULE } from "./fichiersIntegrationAvecMocksDeModule";

export default defineProject({
  plugins: [tsconfigPaths()],
  test: {
    name: "server-integration",
    root: "./",
    environment: "node",
    include: ["src/server/**/*.integration.test.{ts,tsx}"],
    exclude: FICHIERS_INTEGRATION_AVEC_MOCKS_DE_MODULE,
    setupFiles: [
      "./vitest.setup.server.ts",
      "./src/server/infrastructure/test/integrationTestSetup.ts",
    ],
    pool: "forks",
    fileParallelism: false,
    // Les fichiers sont deja serialises par `fileParallelism`, et l'isolation
    // reelle vient du nettoyage de la base entre les tests, pas du process. Un
    // registre de modules neuf par fichier ne garantissait donc rien de plus, il
    // faisait juste payer 195 fois l'import de Prisma, du container et de
    // next-auth : 16,9 s de setup et 7,8 s d'import, tombes a 0,6 s et 3,3 s.
    //
    // Contrepartie : `vi.mock` ne fonctionne plus, un module deja importe par un
    // fichier precedent ne peut plus etre remplace, et le test part alors sur le
    // vrai appel. Les fichiers concernes sont listes dans
    // `fichiersIntegrationAvecMocksDeModule` et tournent dans le projet
    // `server-integration-mocks`, qui garde l'isolation.
    isolate: false,
    // vitest refuse que deux projets aient un `maxWorkers` different et le meme
    // `groupOrder`. `fileParallelism: false` force maxWorkers a 1 ici, la ou les
    // projets unitaires gardent le defaut : il faut donc un ordre distinct, qui
    // fait au passage tourner l'integration apres les tests unitaires.
    sequence: { groupOrder: 1 },
    globals: true,
  },
  ssr: {
    noExternal: ["next-auth"],
  },
});
