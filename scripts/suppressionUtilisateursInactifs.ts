import { loadEnvConfig } from '@next/env';
import logger from '@/server/infrastructure/Logger';
import { getGestionUtilisateurContainer } from '@/server/gestion-utilisateur/container';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  await getGestionUtilisateurContainer().resolve('supprimerLesComptesDesactivesUseCase').run();
}

const isMain = eval('require.main === module');
if (isMain) {
  main()
    .then(() => {
      logger.info('Suppression des utilisateurs terminée');
    })
    .catch((error) => {
      logger.error(error);
      throw new Error('Echec de la suppression', { cause: error });
    });
}
