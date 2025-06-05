import { loadEnvConfig } from '@next/env';
import process from 'node:process';
import logger from '@/server/infrastructure/Logger';
import { getInitialContainer } from '@/server/initial-container';
import { getChantiersContainer } from '@/server/chantiers/container';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const initialContainer = getInitialContainer();
  return getChantiersContainer(initialContainer).resolve('envoyerLesRapportsPropositionValeurAvancementUseCase').run();
}

const isMain = eval('require.main === module');
if (isMain) {
  main()
    .then(() => {
      logger.info('Envoie des rapports ok');
    })
    .catch((error) => {
      logger.error(error);
      throw new Error('Envoie des rapports en échec', { cause: error });
    });
}
