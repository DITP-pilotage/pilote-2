import {
  PrismaMesureIndicateurTemporaireRepository,
} from '@/server/import-indicateur/infrastructure/adapters/PrismaMesureIndicateurTemporaireRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import {
  MesureIndicateurTemporaireBuilder,
} from '@/server/import-indicateur/app/builder/MesureIndicateurTemporaire.builder';
import { DetailValidationFichierBuilder } from '@/server/import-indicateur/app/builder/DetailValidationFichier.builder';
import { PrismaRapportRepository } from '@/server/import-indicateur/infrastructure/adapters/PrismaRapportRepository';
import UtilisateurÀCréerOuMettreÀJourBuilder from '@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder';
import { dependencies } from '@/server/infrastructure/Dependencies';

describe('PrismaMesureIndicateurTemporaireRepository', () => {
  let prismaRapportRepository: PrismaRapportRepository;
  let prismaMesureIndicateurTemporaireRepository: PrismaMesureIndicateurTemporaireRepository;

  beforeEach(() => {
    prismaRapportRepository = new PrismaRapportRepository(prisma);
    prismaMesureIndicateurTemporaireRepository = new PrismaMesureIndicateurTemporaireRepository(prisma);
  });

  describe('#sauvegarder', () => {
    it('doit sauvegarder les données', async () => {
      // GIVEN
      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').avecHabilitationsLecture([], [], []).build();
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur as any, 'test');

      const rapport = new DetailValidationFichierBuilder()
        .avecId('6cba829c-def8-4f21-9bb0-07bd5a36bd02')
        .avecUtilisateurEmail('ditp.admin@example.com')
        .build();
      await prismaRapportRepository.sauvegarder(rapport);

      const listeMesuresIndicateurTemporaire = [
        new MesureIndicateurTemporaireBuilder()
          .avecId('b2450ce3-8006-4550-8132-e5aab19c0caf')
          .avecRapportId('6cba829c-def8-4f21-9bb0-07bd5a36bd02')
          .avecIndicId('IND-001')
          .avecMetricDate('30/12/2022')
          .avecMetricType('vi')
          .avecMetricValue('12')
          .avecZoneId('D001')
          .build(),
        new MesureIndicateurTemporaireBuilder()
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
      await prismaMesureIndicateurTemporaireRepository.sauvegarder(listeMesuresIndicateurTemporaire);

      // THEN
      const resultListeIndicateursData = await prisma.mesure_indicateur_temporaire.findMany();

      expect(resultListeIndicateursData).toHaveLength(2);

      expect(resultListeIndicateursData[0].id).toEqual('b2450ce3-8006-4550-8132-e5aab19c0caf');
      expect(resultListeIndicateursData[0].rapport_id).toEqual('6cba829c-def8-4f21-9bb0-07bd5a36bd02');
      expect(resultListeIndicateursData[0].indic_id).toEqual('IND-001');
      expect(resultListeIndicateursData[0].metric_date).toEqual('30/12/2022');
      expect(resultListeIndicateursData[0].metric_type).toEqual('vi');
      expect(resultListeIndicateursData[0].metric_value).toEqual('12');
      expect(resultListeIndicateursData[0].zone_id).toEqual('D001');

      expect(resultListeIndicateursData[1].id).toEqual('f7632d30-5b49-465e-8774-063f9f67f83b');
      expect(resultListeIndicateursData[1].rapport_id).toEqual('6cba829c-def8-4f21-9bb0-07bd5a36bd02');
      expect(resultListeIndicateursData[1].indic_id).toEqual('IND-002');
      expect(resultListeIndicateursData[1].metric_date).toEqual('31/12/2022');
      expect(resultListeIndicateursData[1].metric_type).toEqual('vc');
      expect(resultListeIndicateursData[1].metric_value).toEqual('15');
      expect(resultListeIndicateursData[1].zone_id).toEqual('D002');
    });
  });

  describe('recupererToutParRapportId', () => {
    it('doit récupérer les mesures indicateurs temporaire liés au rapport id', async () => {
      // GIVEN
      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').avecHabilitationsLecture([], [], []).build();
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur as any, 'test');

      const rapport = new DetailValidationFichierBuilder()
        .avecId('6cba829c-def8-4f21-9bb0-07bd5a36bd02')
        .avecUtilisateurEmail('ditp.admin@example.com')
        .build();
      const rapport2 = new DetailValidationFichierBuilder()
        .avecId('1402c583-e04f-4236-a59f-39b1e8890bc1')
        .avecUtilisateurEmail('ditp.admin@example.com')
        .build();
      await prismaRapportRepository.sauvegarder(rapport);
      await prismaRapportRepository.sauvegarder(rapport2);

      const listeMesuresIndicateurTemporaire = [
        new MesureIndicateurTemporaireBuilder()
          .avecId('c3adee3f-3ec8-4a74-9787-6eaa757028ac')
          .avecIndicId('IND-001')
          .avecMetricDate('30/12/2022')
          .avecMetricType('vi')
          .avecMetricValue('12')
          .avecRapportId('6cba829c-def8-4f21-9bb0-07bd5a36bd02')
          .avecZoneId('D001')
          .build(),
        new MesureIndicateurTemporaireBuilder()
          .avecId('88dc64cf-6a2a-4789-b8d7-ad98f72bd236')
          .avecIndicId('IND-002')
          .avecMetricDate('31/12/2022')
          .avecMetricType('vc')
          .avecMetricValue('15')
          .avecRapportId('6cba829c-def8-4f21-9bb0-07bd5a36bd02')
          .avecZoneId('D002')
          .build(),
        new MesureIndicateurTemporaireBuilder()
          .avecId('5ede3f95-e0ef-4b8f-8100-3f382ba3f47a')
          .avecIndicId('IND-003')
          .avecMetricDate('31/12/2022')
          .avecMetricType('vc')
          .avecMetricValue('15')
          .avecRapportId('1402c583-e04f-4236-a59f-39b1e8890bc1')
          .avecZoneId('D002')
          .build(),
      ];
      await prismaMesureIndicateurTemporaireRepository.sauvegarder(listeMesuresIndicateurTemporaire);
      // WHEN
      const resultListeMesuresIndicateurTemporaire = await prismaMesureIndicateurTemporaireRepository.recupererToutParRapportId('6cba829c-def8-4f21-9bb0-07bd5a36bd02');

      // THEN
      expect(resultListeMesuresIndicateurTemporaire).toHaveLength(2);
      expect(resultListeMesuresIndicateurTemporaire[0].rapportId).toEqual('6cba829c-def8-4f21-9bb0-07bd5a36bd02');
      expect(resultListeMesuresIndicateurTemporaire[1].rapportId).toEqual('6cba829c-def8-4f21-9bb0-07bd5a36bd02');
    });
  });

  describe('supprimerToutParRapportId', () => {
    it('doit supprimer les mesures indicateurs temporaires liés à un rapport', async () => {
      // GIVEN
      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').avecHabilitationsLecture([], [], []).build();
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur as any, 'test');

      const rapport = new DetailValidationFichierBuilder()
        .avecId('6cba829c-def8-4f21-9bb0-07bd5a36bd02')
        .avecUtilisateurEmail('ditp.admin@example.com')
        .build();
      const rapport2 = new DetailValidationFichierBuilder()
        .avecId('1402c583-e04f-4236-a59f-39b1e8890bc1')
        .avecUtilisateurEmail('ditp.admin@example.com')
        .build();
      await prismaRapportRepository.sauvegarder(rapport);
      await prismaRapportRepository.sauvegarder(rapport2);

      const listeMesuresIndicateurTemporaire = [
        new MesureIndicateurTemporaireBuilder()
          .avecId('b2450ce3-8006-4550-8132-e5aab19c0caf')
          .avecRapportId('6cba829c-def8-4f21-9bb0-07bd5a36bd02')
          .avecIndicId('IND-001')
          .avecMetricDate('30/12/2022')
          .avecMetricType('vi')
          .avecMetricValue('12')
          .avecZoneId('D001')
          .build(),
        new MesureIndicateurTemporaireBuilder()
          .avecId('f7632d30-5b49-465e-8774-063f9f67f83b')
          .avecRapportId('6cba829c-def8-4f21-9bb0-07bd5a36bd02')
          .avecIndicId('IND-002')
          .avecMetricDate('31/12/2022')
          .avecMetricType('vc')
          .avecMetricValue('15')
          .avecZoneId('D002')
          .build(),
        new MesureIndicateurTemporaireBuilder()
          .avecId('5ede3f95-e0ef-4b8f-8100-3f382ba3f47a')
          .avecIndicId('IND-003')
          .avecMetricDate('31/12/2022')
          .avecMetricType('vc')
          .avecMetricValue('15')
          .avecRapportId('1402c583-e04f-4236-a59f-39b1e8890bc1')
          .avecZoneId('D002')
          .build(),
      ];
      await prismaMesureIndicateurTemporaireRepository.sauvegarder(listeMesuresIndicateurTemporaire);

      // WHEN
      await prismaMesureIndicateurTemporaireRepository.supprimerToutParRapportId('6cba829c-def8-4f21-9bb0-07bd5a36bd02');

      // THEN
      const resultListeIndicateursData = await prisma.mesure_indicateur_temporaire.findMany();

      expect(resultListeIndicateursData).toHaveLength(1);
      expect(resultListeIndicateursData[0].rapport_id).not.toEqual('6cba829c-def8-4f21-9bb0-07bd5a36bd02');
    });
  });
});
