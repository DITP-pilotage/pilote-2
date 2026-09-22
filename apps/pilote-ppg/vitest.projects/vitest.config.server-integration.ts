import { defineProject } from "vitest/config";

export default defineProject({
  resolve: { tsconfigPaths: true },
  test: {
    name: "server-integration",
    root: "./",
    environment: "node",
    include: ["src/server/**/*.integration.test.{ts,tsx}"],
    setupFiles: [
      "./vitest.setup.server.ts",
      "./src/server/infrastructure/test/integrationTestSetup.ts",
    ],
    pool: "forks",
    // Les tests ne se voient plus entre eux : chacun tourne dans une transaction
    // annulee a la fin, donc rien n'est commit et deux workers concurrents ne
    // peuvent pas se marcher dessus. `fileParallelism: false` n'avait de sens que
    // tant que l'isolation reposait sur un TRUNCATE de la base partagee.
    fileParallelism: true,
    // Les fichiers sont deja serialises par `fileParallelism`, et l'isolation
    // reelle vient du nettoyage de la base entre les tests, pas du process. Un
    // registre de modules neuf par fichier ne garantissait donc rien de plus, il
    // faisait juste payer 195 fois l'import de Prisma, du container et de
    // next-auth : 16,9 s de setup et 7,8 s d'import, tombes a 0,6 s et 3,3 s.
    //
    // Contrepartie : `vi.mock` ne fonctionne plus, un module deja importe par un
    // fichier precedent ne peut plus etre remplace. Aucun test d'integration
    // n'en a besoin : ils passent tous par de vraies requetes et de vrais
    // fichiers.
    isolate: false,
    // Un ordre distinct de celui des projets unitaires, pour que l'integration
    // tourne apres eux.
    sequence: { groupOrder: 1 },
    globals: true,
  },
  ssr: {
    noExternal: ["next-auth"],
  },
});
