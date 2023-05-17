import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { DetailValidationFichierBuilder } from '@/server/import-indicateur/app/builder/DetailValidationFichier.builder';
import { PrismaRapportRepository } from '@/server/import-indicateur/infrastructure/adapters/PrismaRapportRepository';
import UtilisateurÀCréerOuMettreÀJourBuilder from '@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder';
import { dependencies } from '@/server/infrastructure/Dependencies';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';

describe('PrismaRapportRepository', () => {
  let prismaRapportRepository: PrismaRapportRepository;
  let utilisateurSQLRepository: UtilisateurRepository;

  beforeEach(() => {
    utilisateurSQLRepository = dependencies.getUtilisateurRepository();
    prismaRapportRepository = new PrismaRapportRepository(prisma);
  });
  describe('#sauvegarder', () => {
    it('doit sauvegarder le rapport', async () => {
      // GIVEN
      const now = new Date();

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').build();
      await utilisateurSQLRepository.créerOuMettreÀJour(utilisateur);

      const rapport = new DetailValidationFichierBuilder()
        .avecId('f69bbd1f-de95-442a-9392-df644e1096f8')
        .avecUtilisateurEmail('ditp.admin@example.com')
        .avecDateCreation(now)
        .build();

      // WHEN
      await prismaRapportRepository.sauvegarder(rapport);

      // THEN
      const listeDesRapports = await prisma.rapport_import_mesure_indicateur.findMany();
      expect(listeDesRapports[0].id).toEqual('f69bbd1f-de95-442a-9392-df644e1096f8');
      expect(new Date(listeDesRapports[0].date_creation).getTime()).toEqual(now.getTime());
      expect(listeDesRapports[0].utilisateurEmail).toEqual('ditp.admin@example.com');
    });
  });
});
