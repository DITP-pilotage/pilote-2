import { readFileSync } from "node:fs";
import dotenv from "dotenv";

/**
 * Environnement des evals : surcouche locale, puis garde-fous.
 *
 * `pnpm eval` force `DOTENV_CONFIG_PATH=.env.test`, donc `.env` n'est jamais
 * lu — c'est delibere. Les evals reutilisent `integrationTestSetup`, dont le
 * `beforeEach` fait un `TRUNCATE TABLE ... CASCADE` sur tout le schema : si
 * `DATABASE_URL` pointait sur la base de dev, ce TRUNCATE la viderait sans le
 * moindre message. Le cout d'un oubli de la variable dans un script est donc la
 * base de dev, d'ou les controles ci-dessous.
 *
 * Module a effet de bord, importe en premier par `setup.ts` : le client Prisma
 * lit `DATABASE_URL` des son import, donc tout doit passer avant lui.
 */

const TEST_ENV_PATH = ".env.test";
const SECRETS_PATH = ".env.evals.local";

/**
 * `.env.test` est versionne et ne contient que des valeurs factices — une cle
 * d'API n'y a pas sa place. Les secrets propres aux evals vivent donc dans un
 * fichier local ignore par git, applique par-dessus.
 */
dotenv.config({ path: SECRETS_PATH, override: true });

const expectedDatabaseUrl = dotenv.parse(
  readFileSync(TEST_ENV_PATH),
).DATABASE_URL;

if (!expectedDatabaseUrl) {
  throw new Error(`${TEST_ENV_PATH} ne definit pas DATABASE_URL.`);
}

if (process.env.DATABASE_URL !== expectedDatabaseUrl) {
  throw new Error(
    [
      `Les evals doivent tourner sur la base de test, pas sur ${process.env.DATABASE_URL}.`,
      `Attendu (${TEST_ENV_PATH}) : ${expectedDatabaseUrl}`,
      "Lancez-les via `pnpm eval`, qui force DOTENV_CONFIG_PATH=.env.test.",
    ].join("\n"),
  );
}

// Non bloquant pour convict (`default: "ToBeDefined"`), donc invisible au
// demarrage : sans ce controle, une cle absente se manifeste en 401 apres
// plusieurs minutes de run.
if (!process.env.ALBERT_API_KEY) {
  throw new Error(
    [
      `ALBERT_API_KEY est absent. Creez ${SECRETS_PATH} (ignore par git) avec :`,
      "  ALBERT_API_KEY=<votre cle, recopiee depuis .env>",
    ].join("\n"),
  );
}
