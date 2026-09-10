import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "evalite/config";

/**
 * SPIKE — configuration Evalite du POC.
 *
 * Evalite tourne a cote de Vitest, avec son propre runner : rien ici n'est
 * branche sur vitest.projects/, et `pnpm test` reste inchange.
 */
export default defineConfig({
  // Les evals importent le code de prod via les alias `@/...` du tsconfig.
  // Sans ce plugin, tous les imports d'Albert cassent.
  //
  // `ssr.noExternal` reprend vitest.projects/vitest.config.server-integration.ts :
  // next-auth importe `next/server` sans extension, ce que l'ESM de Node refuse
  // tant que le paquet n'est pas transforme par Vite. Le container `albert` tire
  // le module d'authentification, donc l'eval passe par ce chemin.
  viteConfig: {
    plugins: [tsconfigPaths()],
    ssr: { noExternal: ["next-auth"] },

    // `globals` : integrationTestSetup utilise `beforeEach` / `afterAll` sans
    // les importer. `fileParallelism` : son `beforeEach` TRUNCATE tout le
    // schema, donc deux fichiers d'eval en parallele se videraient la base
    // mutuellement — `maxConcurrency` ne couvre pas ce cas, il ne plafonne que
    // les cas concurrents A L'INTERIEUR d'un fichier.
    test: { globals: true, fileParallelism: false },
  },

  // Charge apres `evalite/env-setup-file`, que le runner prefixe en dur.
  setupFiles: ["./evals/setup.ts"],

  // Un tour d'agent Albert enchaine jusqu'a 50 etapes et plusieurs allers-retours
  // Prisma : les 30 s par defaut ne suffisent pas. Mesure sur le POC : les cas
  // qui passent par search_chantiers (lui-meme un sous-agent LLM) depassent 180 s.
  testTimeout: 420_000,

  // L'API Albert est mutualisee entre les agents de l'Etat et repond
  // « Too Many Requests » bien avant le defaut d'Evalite (5 en parallele).
  // Mesure du spike : a maxConcurrency 2 avec trialCount 3, un tiers des cas
  // echouent en AI_RetryError apres 3 tentatives. A 1, le run passe.
  // C'est la contrainte dimensionnante de tout eval d'agent sur Albert : le
  // debit de l'API, pas le temps CPU.
  maxConcurrency: 1,
});
