import { loadEnvConfig } from '@next/env';
import process from 'node:process';
import assert from 'node:assert/strict';
import { logger } from '@/server/infrastructure/Logger';
import { UtilisateurCSVParseur } from '@/server/infrastructure/import_csv/utilisateur/UtilisateurCSVParseur';
import { UtilisateurIAMKeycloakRepository } from '@/server/infrastructure/accès_données/utilisateur/UtilisateurIAMKeycloakRepository';
import { PrismaUtilisateurRepository } from '@/server/infrastructure/accès_données/utilisateur/PrismaUtilisateurRepository';
import { PrismaPilote } from '@/server/db/PrismaPilote';

const projectDir = process.cwd();
loadEnvConfig(projectDir);  // ⚠️ À appeler avant nos imports, because Configuration.ts est aussi chargée côté front

async function main() {
  const filename = process.argv[2]; 
  assert(filename, 'Nom de fichier CSV manquant');

  const prismaPilote = new PrismaPilote();

  const utilisateurIAMRepository = new UtilisateurIAMKeycloakRepository();
  const utilisateurRepository = new PrismaUtilisateurRepository({ prisma: prismaPilote });

  const emailsASupprimer = new UtilisateurCSVParseur(filename).parseComptesASupprimer();
  for (const email of emailsASupprimer) {
    await utilisateurIAMRepository.supprime(email);
    await utilisateurRepository.supprimer(email);
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
