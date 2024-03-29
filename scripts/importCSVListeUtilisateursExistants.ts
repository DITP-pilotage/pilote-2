import { loadEnvConfig } from '@next/env';
import process from 'node:process';
import assert from 'node:assert/strict';
import logger from '@/server/infrastructure/Logger';
import UtilisateurCSVParseur from '@/server/infrastructure/import_csv/utilisateur/UtilisateurCSVParseur';

const projectDir = process.cwd();
loadEnvConfig(projectDir);  // ⚠️ À appeler avant nos imports, because Configuration.ts est aussi chargée côté front

/**
 - Format CSV attendu:
      nom,prénom,email,profil,scope,territoires,périmètreIds,chantierIds
      Dupont,Jean,reg.sgar002@example.com,PREFET_REGION,lecture,REG-12,,
      Dupont,Jean,reg.sgar002@example.com,PREFET_REGION,saisieCommentaire,REG-12,,
      Dupont,Jean,reg.sgar002@example.com,PREFET_REGION,saisieIndicateur,REG-12,,
      Durand,Pierre,dp.dir@example.com,DIR_PROJET,lecture,TOUS,,CH-001|CH-002
      Durand,Pierre,dp.dir@example.com,DIR_PROJET,saisieCommentaire,NAT-FR,,CH-001
      Durand,Pierre,dp.dir@example.com,DIR_PROJET,saisieIndicateur,TOUS,,

 - Comment exécuter le script en local : 
      npx ts-node scripts/importCSVListeUtilisateursExistants.ts /chemin/fichier/local/import.csv | npx pino-pretty

  - Remarques :
      Le CSV doit être encodé en utf8, et nous n'avons testé que sans BOM.
      Le CSV doit contenir le même nombre de champs pour toutes les lignes, séparés par des ",".
      Si l'utilisateur est bien importé dans Keycloak, le script loggue une info (INFO) de création avec son email.
      Si un email est déjà utilisé dans Keycloak, le script loggue un warning (WARN) et ignore cet utilisateur pour Keycloak.
      Les utilisateurs existants sont remplacés et leurs droits également.

*/

async function main() {
  const filename = process.argv[2];
  assert(filename, 'Nom de fichier CSV manquant');

  const utilisateurs = new UtilisateurCSVParseur(filename).parse().parsedCsvRecords;
}

const isMain = eval('require.main === module');
if (isMain) {
  main()
    .then(() => {
      logger.info('Exécution terminée.');
    })
    .catch((error) => {
      logger.error(error);
      throw new Error("Erreur lors de l'exécution", { cause: error });
    });
}
