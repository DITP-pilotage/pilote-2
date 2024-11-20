import { loadEnvConfig } from '@next/env';
import logger from '@/server/infrastructure/Logger';
import { UtilisateurIAMKeycloakRepository } from '@/server/gestion-utilisateur/infrastructure/adapters/UtilisateurIAMKeycloakRepository';
import { UtilisateurSQLRepository } from '@/server/gestion-utilisateur/infrastructure/adapters/UtilisateurSQLRepository';
import CommentaireSQLRepository from '@/server/infrastructure/accès_données/chantier/commentaire/CommentaireSQLRepository';
import { SynthèseDesRésultatsSQLRepository } from '@/server/infrastructure/accès_données/chantier/synthèseDesRésultats/SynthèseDesRésultatsSQLRepository';
import DécisionStratégiqueSQLRepository from '@/server/infrastructure/accès_données/chantier/décisionStratégique/DécisionStratégiqueSQLRepository';
import ObjectifSQLRepository from '@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository';
import { PrismaRapportRepository } from '@/server/import-indicateur/infrastructure/adapters/PrismaRapportRepository';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {  
  const commentaireRepository = new CommentaireSQLRepository();
  const syntheseDesResultatsRepository = new SynthèseDesRésultatsSQLRepository();
  const decisionsStrategiquesRepository = new DécisionStratégiqueSQLRepository();
  const objectifsRepository = new ObjectifSQLRepository();
  const rapportRepository = new PrismaRapportRepository();
  const utilisateurIAMRepository = new UtilisateurIAMKeycloakRepository();
  const utilisateurRepository = new UtilisateurSQLRepository();

  const dateDesactivationMax = new Date();
  // dateDesactivationMax.setFullYear(dateDesactivationMax.getFullYear() - 2);
  const utilisateursInactifs = await utilisateurRepository.recupererComptesInactifs(dateDesactivationMax);
  logger.info(`${utilisateursInactifs.length} utilisateurs à supprimer`);

  const emailAuteurRemplacement = 'auteur.inconnu@modernisation.gouv.fr';
  const listeUtilisateurASupprimerIds = utilisateursInactifs.map(utilisateur => utilisateur.id);
  const listeUtilisateurASupprimerEmails = utilisateursInactifs.map(utilisateur => utilisateur.email);
  await Promise.all([
    commentaireRepository.anonymiserAuteurs(listeUtilisateurASupprimerIds, emailAuteurRemplacement),
    syntheseDesResultatsRepository.anonymiserAuteurs(listeUtilisateurASupprimerIds, emailAuteurRemplacement),
    decisionsStrategiquesRepository.anonymiserAuteurs(listeUtilisateurASupprimerIds, emailAuteurRemplacement),
    objectifsRepository.anonymiserAuteurs(listeUtilisateurASupprimerIds, emailAuteurRemplacement),
    utilisateurRepository.anonymiserAuteurs(listeUtilisateurASupprimerIds, emailAuteurRemplacement),
    rapportRepository.anonymiserAuteurs(listeUtilisateurASupprimerEmails, emailAuteurRemplacement),
  ]);
  
  await utilisateurRepository.supprimerListeUtilisateur(listeUtilisateurASupprimerIds);
  for (const email of listeUtilisateurASupprimerEmails) {
    await utilisateurIAMRepository.supprime(email);
  }
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
