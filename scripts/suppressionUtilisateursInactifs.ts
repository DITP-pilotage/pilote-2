import { loadEnvConfig } from '@next/env';
import logger from '@/server/infrastructure/Logger';
import { getGestionUtilisateurContainer } from '@/server/gestion-utilisateur/container';
import { envoieMessageTchap } from '@/server/utils/notification-tchap';
import { getInitialContainer } from '@/server/initial-container';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const initialContainer = getInitialContainer();
  return getGestionUtilisateurContainer(initialContainer).resolve('supprimerLesComptesDesactivesUseCase').run();
}

const isMain = eval('require.main === module');
if (isMain) {
  main()
    .then(async (utilisateursSupprimes) => {
      logger.info('Suppression des utilisateurs terminée');
      const messageSuccesSuppression = [
        '## Rapport hebdomadaire de la suppression des utilisateurs :',
        `${utilisateursSupprimes.length} utilisateurs supprimés :`,
        utilisateursSupprimes.map(utilisateur => `* ${utilisateur.email}`).join('\n'),
      ].join('\n');
      envoieMessageTchap(messageSuccesSuppression);
    })
    .catch((error) => {
      const messageEchecSuppression = [
        '## ⚠️ Erreur lors de la suppression des utilisateurs',
        'Veuillez regarder les logs pour en savoir plus :',
        `- [Logs](${process.env.SCALINGO_LOGS_URL})`,
      ].join('\n');
      envoieMessageTchap(messageEchecSuppression);
      logger.error(error);
    });
}
