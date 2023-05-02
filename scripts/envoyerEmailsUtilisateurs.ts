import process from 'node:process';
import assert from 'node:assert/strict';
import logger from '@/server/infrastructure/logger';
import parseUtilisateursCsv from '@/server/infrastructure/import_csv/identité/parseUtilisateursCsv';
import EnvoyerEmailsUtilisateursUseCase from '@/server/usecase/identité/EnvoyerEmailsUtilisateursUseCase';

/**
 * Exemple de CSV en entrée :
 *
 * voir autres scripts.
 *
 * Exemple d'usage :
 *
 * $ npx ts-node scripts/envoyerEmailsUtilisateurs.ts /tmp/utilisateurs.csv | npx pino-pretty | tee -a /tmp/email.log
 *
 * Prérequis :
 *
 * - Avoir un serveur SMTP
 * - Configurer les variables d'env SMTP (voir Configuration.ts)
 * - Sur un one-off, ajouter les devDependencies :
 *     export NPM_CONFIG_PRODUCTION=false
 *     npm ci
 */

async function main() {
  const filename = process.argv[2];
  assert(filename, 'Nom de fichier CSV manquant');
  const utilisateursPourImport = parseUtilisateursCsv(filename);
  const usecase = new EnvoyerEmailsUtilisateursUseCase();
  await usecase.run(utilisateursPourImport);
}

const isMain = eval('require.main === module');
if (isMain) {
  main()
    .then(() => {
      logger.info('Envoi d\'emails OK.');
    })
    .catch((error) => {
      logger.error(error);
      throw new Error('Envoi d\'emails échoués.', { cause: error });
    });
}
