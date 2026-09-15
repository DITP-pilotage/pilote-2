/**
 * Fichiers d'integration qui appellent `vi.mock` sur un module applicatif.
 *
 * Ils sont exclus du projet `server-integration` (qui tourne sans isolation, pour
 * ne pas payer 195 fois le cout d'import de Prisma et du container) et executes
 * par `server-integration-mocks`, qui garde l'isolation.
 *
 * A tenir a jour : un nouveau fichier d'integration qui utilise `vi.mock` doit
 * etre ajoute ici, sinon son mock sera silencieusement ignore.
 *
 * A SUPPRIMER AVEC VALIDATA : les deux fichiers listes couvrent le parcours
 * d'import d'indicateurs qui passe par Validata, et ne mockent `ParseForm` et
 * `FichierService` que pour ne pas appeler le service pour de vrai. Le jour ou
 * Validata sort du produit, verifier ce qu'il reste de ces tests : si la liste se
 * vide, ce module, le projet `server-integration-mocks` et l'`exclude` de
 * `server-integration` disparaissent avec elle, et toute la suite d'integration
 * retrouve un seul projet.
 */
export const FICHIERS_INTEGRATION_AVEC_MOCKS_DE_MODULE = [
  "src/server/import-indicateur/__tests__/infrastructure/handlers/ImportDonneeIndicateurAPIHandler.integration.test.ts",
  "src/server/import-indicateur/__tests__/infrastructure/handlers/VerifierImportIndicateurHandler.integration.test.ts",
];
