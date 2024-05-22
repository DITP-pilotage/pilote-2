import { loadEnvConfig } from '@next/env';
import { createObjectCsvWriter } from 'csv-writer';
import { PrismaClient } from '@prisma/client';
import process from 'node:process';
import assert from 'node:assert/strict';
import logger from '@/server/infrastructure/Logger';
import UtilisateurCSVParseur from '@/server/infrastructure/import_csv/utilisateur/UtilisateurCSVParseur';
import ImporterDesUtilisateursUseCase from '@/server/usecase/utilisateur/ImporterDesUtilisateursUseCase';
import RécupérerListeUtilisateursExistantsUseCase
  from '@/server/usecase/utilisateur/RécupérerListeUtilisateursExistantsUseCase';
import { CsvRecord } from '@/server/infrastructure/import_csv/utilisateur/UtilisateurCSVParseur.interface';
import { UtilisateurSQLRepository } from '@/server/infrastructure/accès_données/utilisateur/UtilisateurSQLRepository';
import UtilisateurIAMKeycloakRepository
  from '@/server/infrastructure/accès_données/utilisateur/UtilisateurIAMKeycloakRepository';
import { TerritoireSQLRepository } from '@/server/infrastructure/accès_données/territoire/TerritoireSQLRepository';

const projectDir = process.cwd();
loadEnvConfig(projectDir);  // ⚠️ À appeler avant nos imports, because Configuration.ts est aussi chargée côté front

async function main() {
  const filename = process.argv[2]; 
  assert(filename, 'Nom de fichier CSV manquant');

  const prisma = new PrismaClient();

  const keycloakUrl = process.env.IMPORT_KEYCLOAK_URL as string;
  const clientId = process.env.IMPORT_CLIENT_ID as string;
  const clientSecret = process.env.IMPORT_CLIENT_SECRET as string;
  console.log(keycloakUrl, clientId, clientSecret)

  const utilisateurIAMRepository = new UtilisateurIAMKeycloakRepository(keycloakUrl, clientId, clientSecret);

  const contenuParsé = new UtilisateurCSVParseur(filename).parse();
  let utilisateurs = contenuParsé.parsedCsvRecords;
  const utilisateursEmails = utilisateurs.map(utilisateur => utilisateur.email)
  for (const email of utilisateursEmails) {
    await utilisateurIAMRepository.supprime(email);
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
