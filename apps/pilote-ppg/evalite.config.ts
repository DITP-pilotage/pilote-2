import { defineConfig } from "evalite/config";
import { createSqliteStorage } from "evalite/sqlite-storage";

/**
 * SPIKE — configuration Evalite du POC.
 *
 * Evalite tourne a cote de Vitest, avec son propre runner : rien ici n'est
 * branche sur vitest.projects/, et `pnpm test` reste inchange.
 */
export default defineConfig({
  // Par defaut Evalite garde les resultats en memoire : chaque ouverture de
  // l'UI repart de zero, et un run complet prend une quinzaine de minutes.
  // La base reste locale, ignoree par git : elle pese plusieurs dizaines de Mo
  // et grossit a chaque run.
  storage: () => createSqliteStorage("./evals/evalite.db"),

  // Les evals importent le code de prod via les alias `@/...` du tsconfig.
  // Sans `tsconfigPaths`, tous les imports d'Albert cassent.
  //
  // `ssr.noExternal` reprend vitest.projects/vitest.config.server-integration.ts :
  // next-auth importe `next/server` sans extension, ce que l'ESM de Node refuse
  // tant que le paquet n'est pas transforme par Vite. Le container `albert` tire
  // le module d'authentification, donc l'eval passe par ce chemin.
  viteConfig: {
    resolve: { tsconfigPaths: true },
    ssr: { noExternal: ["next-auth"] },

    // `globals` : integrationTestSetup utilise `beforeAll` / `afterAll` sans
    // les importer. `fileParallelism` : chaque fichier vide puis seme le meme
    // monde, aux memes identifiants (`seedWorldPerFile`) ; deux fichiers en
    // parallele videraient le monde l'un de l'autre.
    test: { globals: true, fileParallelism: false },
  },

  // Charge apres `evalite/env-setup-file`, que le runner prefixe en dur.
  setupFiles: ["./evals/setup.ts"],

  // Un tour d'agent Albert enchaine jusqu'a 50 etapes et plusieurs allers-retours
  // Prisma : les 30 s par defaut ne suffisent pas. Mesure sur le POC : les cas
  // qui passent par search_chantiers (lui-meme un sous-agent LLM) depassent 180 s.
  testTimeout: 420_000,

  // Le quota de production (200 requetes par minute sur gpt-oss-120b) leve
  // la contrainte du spike, ou l'API mutualisee saturait des 2 cas en
  // parallele. Les cas d'un fichier ne se bloquent pas en base : le monde est
  // seme une fois par fichier, hors de leurs transactions.
  // Mesure du 07/10 sur le niveau 2 : 20 min a 1, 10 min 36 a 3, 8 min 35 a
  // 6, avec un pic de 76 requetes par minute.
  maxConcurrency: 6,

  // Evalite met en cache les sorties du modele, et sa cle de cache inclut
  // `trialCount` sans inclure l'INDEX de l'essai : les 3 essais d'un meme cas
  // partagent donc une entree et renvoient une sortie identique. Le cache par
  // defaut annule exactement ce que `trialCount` sert a mesurer.
  //
  // Mesure : a cache actif, 5,2 s et des essais tous identiques ; a cache
  // coupe, 34,7 s et des essais qui divergent — 0/0/100 sur la clarification,
  // 100/100/50 sur la recherche thematique. C'est ce signal qu'on veut.
  cache: false,
});
