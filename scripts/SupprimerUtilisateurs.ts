import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import process from 'node:process';
import assert from 'node:assert/strict';
import logger from '@/server/infrastructure/Logger';
import UtilisateurCSVParseur from '@/server/infrastructure/import_csv/utilisateur/UtilisateurCSVParseur';
import UtilisateurIAMKeycloakRepository
  from '@/server/infrastructure/accès_données/utilisateur/UtilisateurIAMKeycloakRepository';
import { UtilisateurSQLRepository } from '@/server/infrastructure/accès_données/utilisateur/UtilisateurSQLRepository';

const projectDir = process.cwd();
loadEnvConfig(projectDir);  // ⚠️ À appeler avant nos imports, because Configuration.ts est aussi chargée côté front

async function main() {
  const filename = process.argv[2]; 
  assert(filename, 'Nom de fichier CSV manquant');

  const keycloakUrl = process.env.IMPORT_KEYCLOAK_URL as string;
  const clientId = process.env.IMPORT_CLIENT_ID as string;
  const clientSecret = process.env.IMPORT_CLIENT_SECRET as string;

  const prisma = new PrismaClient();

  const utilisateurIAMRepository = new UtilisateurIAMKeycloakRepository(keycloakUrl, clientId, clientSecret);
  const utilisateurSQLRepository = new UtilisateurSQLRepository(prisma);

  const emailsASupprimer = new UtilisateurCSVParseur(filename).parseComptesASupprimer();
  for (const email of emailsASupprimer) {
    await utilisateurIAMRepository.supprime(email);
    await utilisateurSQLRepository.supprimer(email);
  }
}

const isMain = eval('require.main === module');
if (isMain) {
  main()
    .then(() => {
      logger.info('Suppression OK.');
    })
    .catch((error) => {
      logger.error(error);
      throw new Error('Suppression échoué.', { cause: error });
    });
}
