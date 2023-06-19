import { createMocks } from 'node-mocks-http';
import { dependencies } from '@/server/infrastructure/Dependencies';
import UtilisateurÀCréerOuMettreÀJourBuilder from '@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder';
import { DetailValidationFichierBuilder } from '@/server/import-indicateur/app/builder/DetailValidationFichier.builder';
import {
  MesureIndicateurTemporaireBuilder,
} from '@/server/import-indicateur/app/builder/MesureIndicateurTemporaire.builder';
import handlePublierFichierImportIndicateur
  from '@/server/import-indicateur/infrastructure/handlers/PublierIndicateurHandler';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';

describe('ImportIndicateurHandler', () => {
  it('doit transférer les mesures indicateurs temporaires vers la table permanente', async () => {
    // GIVEN
    const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').build();
    await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur, 'test');

    const rapport = new DetailValidationFichierBuilder()
      .avecId('6cba829c-def8-4f21-9bb0-07bd5a36bd02')
      .avecUtilisateurEmail('ditp.admin@example.com')
      .build();
    const rapport2 = new DetailValidationFichierBuilder()
      .avecId('1402c583-e04f-4236-a59f-39b1e8890bc1')
      .avecUtilisateurEmail('ditp.admin@example.com')
      .build();
    await dependencies.getRapportRepository().sauvegarder(rapport);
    await dependencies.getRapportRepository().sauvegarder(rapport2);

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
    await dependencies.getMesureIndicateurTemporaireRepository().sauvegarder(listeMesuresIndicateurTemporaire);

    const { req, res } = createMocks({
      method: 'POST',
      query: { rapportId: '6cba829c-def8-4f21-9bb0-07bd5a36bd02' },
    });

    // WHEN
    await handlePublierFichierImportIndicateur(req, res);
    // THEN
    const listeMesuresIndicateursTemporaire = await prisma.mesure_indicateur_temporaire.findMany({});
    const listeMesuresIndicateurs = await prisma.mesure_indicateur.findMany({});

    expect(listeMesuresIndicateursTemporaire).toHaveLength(1);
    expect(listeMesuresIndicateursTemporaire[0].rapport_id).not.toEqual('6cba829c-def8-4f21-9bb0-07bd5a36bd02');

    expect(listeMesuresIndicateurs).toHaveLength(2);
    expect(listeMesuresIndicateurs[0].rapport_id).toEqual('6cba829c-def8-4f21-9bb0-07bd5a36bd02');
    expect(listeMesuresIndicateurs[1].rapport_id).toEqual('6cba829c-def8-4f21-9bb0-07bd5a36bd02');
  });
});
