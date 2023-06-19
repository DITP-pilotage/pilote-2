import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { DetailValidationFichierBuilder } from '@/server/import-indicateur/app/builder/DetailValidationFichier.builder';
import { PrismaRapportRepository } from '@/server/import-indicateur/infrastructure/adapters/PrismaRapportRepository';
import UtilisateurÀCréerOuMettreÀJourBuilder from '@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder';
import { dependencies } from '@/server/infrastructure/Dependencies';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import {
  MesureIndicateurTemporaireBuilder,
} from '@/server/import-indicateur/app/builder/MesureIndicateurTemporaire.builder';
import {
  PrismaMesureIndicateurTemporaireRepository,
} from '@/server/import-indicateur/infrastructure/adapters/PrismaMesureIndicateurTemporaireRepository';

describe('PrismaRapportRepository', () => {
  let prismaRapportRepository: PrismaRapportRepository;
  let prismaMesureIndicateurTemporaireRepository: PrismaMesureIndicateurTemporaireRepository;
  let utilisateurSQLRepository: UtilisateurRepository;

  beforeEach(() => {
    utilisateurSQLRepository = dependencies.getUtilisateurRepository();
    prismaRapportRepository = new PrismaRapportRepository(prisma);
    prismaMesureIndicateurTemporaireRepository = new PrismaMesureIndicateurTemporaireRepository(prisma);
  });
  describe('#sauvegarder', () => {
    it('doit sauvegarder le rapport', async () => {
      // GIVEN
      const now = new Date();

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').build();
      await utilisateurSQLRepository.créerOuMettreÀJour(utilisateur, 'test');

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

  describe('#récupérerRapportParId', () => {
    it('doit récupérer le rapport avec les données', async () => {
      // GIVEN
      const now = new Date();

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').build();
      await utilisateurSQLRepository.créerOuMettreÀJour(utilisateur, 'test');

      const listeMesuresIndicateurTemporaire = [
        new MesureIndicateurTemporaireBuilder()
          .avecId('b2450ce3-8006-4550-8132-e5aab19c0caf')
          .avecRapportId('f69bbd1f-de95-442a-9392-df644e1096f8')
          .avecIndicId('IND-001')
          .avecMetricDate('30/12/2022')
          .avecMetricType('vi')
          .avecMetricValue('12')
          .avecZoneId('D001')
          .build(),
        new MesureIndicateurTemporaireBuilder()
          .avecId('f7632d30-5b49-465e-8774-063f9f67f83b')
          .avecRapportId('f69bbd1f-de95-442a-9392-df644e1096f8')
          .avecIndicId('IND-002')
          .avecMetricDate('31/12/2022')
          .avecMetricType('vc')
          .avecMetricValue('15')
          .avecZoneId('D002')
          .build(),
      ];

      // WHEN
      const rapport = new DetailValidationFichierBuilder()
        .avecId('f69bbd1f-de95-442a-9392-df644e1096f8')
        .avecEstValide(true)
        .avecUtilisateurEmail('ditp.admin@example.com')
        .avecDateCreation(now)
        .build();

      await prismaRapportRepository.sauvegarder(rapport);
      await prismaMesureIndicateurTemporaireRepository.sauvegarder(listeMesuresIndicateurTemporaire);

      // WHEN
      const rapportResult = await prismaRapportRepository.récupérerRapportParId('f69bbd1f-de95-442a-9392-df644e1096f8');

      // THEN
      expect(rapportResult.estValide).toEqual(true);
      expect(rapportResult.listeMesuresIndicateurTemporaire).toHaveLength(2);

      expect(rapportResult.listeMesuresIndicateurTemporaire[0].id).toEqual('b2450ce3-8006-4550-8132-e5aab19c0caf');
      expect(rapportResult.listeMesuresIndicateurTemporaire[0].indicId).toEqual('IND-001');
      expect(rapportResult.listeMesuresIndicateurTemporaire[0].metricDate).toEqual('30/12/2022');
      expect(rapportResult.listeMesuresIndicateurTemporaire[0].metricType).toEqual('vi');
      expect(rapportResult.listeMesuresIndicateurTemporaire[0].metricValue).toEqual('12');
      expect(rapportResult.listeMesuresIndicateurTemporaire[0].zoneId).toEqual('D001');

      expect(rapportResult.listeMesuresIndicateurTemporaire[1].id).toEqual('f7632d30-5b49-465e-8774-063f9f67f83b');
      expect(rapportResult.listeMesuresIndicateurTemporaire[1].indicId).toEqual('IND-002');
      expect(rapportResult.listeMesuresIndicateurTemporaire[1].metricDate).toEqual('31/12/2022');
      expect(rapportResult.listeMesuresIndicateurTemporaire[1].metricType).toEqual('vc');
      expect(rapportResult.listeMesuresIndicateurTemporaire[1].metricValue).toEqual('15');
      expect(rapportResult.listeMesuresIndicateurTemporaire[1].zoneId).toEqual('D002');
    });
  });
});
