import {
  PrismaMesureIndicateurRepository,
} from '@/server/import-indicateur/infrastructure/adapters/PrismaMesureIndicateurRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { IndicateurDataBuilder } from '@/server/import-indicateur/app/builder/IndicateurData.builder';
import UtilisateurÀCréerOuMettreÀJourBuilder from '@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder';
import { dependencies } from '@/server/infrastructure/Dependencies';
import { DetailValidationFichierBuilder } from '@/server/import-indicateur/app/builder/DetailValidationFichier.builder';
import { PrismaRapportRepository } from '@/server/import-indicateur/infrastructure/adapters/PrismaRapportRepository';

describe('PrismaMesureIndicateurRepository', () => {
  let prismaRapportRepository: PrismaRapportRepository;
  let prismaMesureIndicateurRepository: PrismaMesureIndicateurRepository;

  describe('#sauvegarder', () => {

    beforeEach(() => {
      prismaRapportRepository = new PrismaRapportRepository(prisma);
      prismaMesureIndicateurRepository = new PrismaMesureIndicateurRepository(prisma);
    });
    it('doit sauvegarder les données', async () => {
      // GIVEN
      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').build();
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur);

      const rapport = new DetailValidationFichierBuilder()
        .avecId('6cba829c-def8-4f21-9bb0-07bd5a36bd02')
        .avecUtilisateurEmail('ditp.admin@example.com')
        .build();
      await prismaRapportRepository.sauvegarder(rapport);

      const listeIndicateursData = [
        new IndicateurDataBuilder()
          .avecId('b2450ce3-8006-4550-8132-e5aab19c0caf')
          .avecRapportId('6cba829c-def8-4f21-9bb0-07bd5a36bd02')
          .avecIndicId('IND-001')
          .avecMetricDate('30/12/2022')
          .avecMetricType('vi')
          .avecMetricValue('12')
          .avecZoneId('D001')
          .build(),
        new IndicateurDataBuilder()
          .avecId('f7632d30-5b49-465e-8774-063f9f67f83b')
          .avecRapportId('6cba829c-def8-4f21-9bb0-07bd5a36bd02')
          .avecIndicId('IND-002')
          .avecMetricDate('31/12/2022')
          .avecMetricType('vc')
          .avecMetricValue('15')
          .avecZoneId('D002')
          .build(),
      ];

      // WHEN
      await prismaMesureIndicateurRepository.sauvegarder(listeIndicateursData);

      // THEN
      const resultListeIndicateursData = await prismaMesureIndicateurRepository.recupererTout();

      expect(resultListeIndicateursData).toHaveLength(2);

      expect(resultListeIndicateursData[0].id).toEqual('b2450ce3-8006-4550-8132-e5aab19c0caf');
      expect(resultListeIndicateursData[0].rapportId).toEqual('6cba829c-def8-4f21-9bb0-07bd5a36bd02');
      expect(resultListeIndicateursData[0].indicId).toEqual('IND-001');
      expect(resultListeIndicateursData[0].metricDate).toEqual('30/12/2022');
      expect(resultListeIndicateursData[0].metricType).toEqual('vi');
      expect(resultListeIndicateursData[0].metricValue).toEqual('12');
      expect(resultListeIndicateursData[0].zoneId).toEqual('D001');

      expect(resultListeIndicateursData[1].id).toEqual('f7632d30-5b49-465e-8774-063f9f67f83b');
      expect(resultListeIndicateursData[1].rapportId).toEqual('6cba829c-def8-4f21-9bb0-07bd5a36bd02');
      expect(resultListeIndicateursData[1].indicId).toEqual('IND-002');
      expect(resultListeIndicateursData[1].metricDate).toEqual('31/12/2022');
      expect(resultListeIndicateursData[1].metricType).toEqual('vc');
      expect(resultListeIndicateursData[1].metricValue).toEqual('15');
      expect(resultListeIndicateursData[1].zoneId).toEqual('D002');
    });
  });
});
