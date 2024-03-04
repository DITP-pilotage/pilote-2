import nock from 'nock';
import { createMocks } from 'node-mocks-http';
import { anyString, mock } from 'jest-mock-extended';
import PersistentFile from 'formidable/PersistentFile';
import handleVerifierFichierImportIndicateur
  from '@/server/import-indicateur/infrastructure/handlers/VerifierImportIndicateurHandler';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { ReportErrorTaskBuilder } from '@/server/import-indicateur/app/builder/ReportErrorTask.builder';
import { ReportResourceTaskBuilder, ReportTaskBuilder } from '@/server/import-indicateur/app/builder/ReportTask.builder';
import { ReportValidataBuilder } from '@/server/import-indicateur/app/builder/ReportValidata.builder';
import UtilisateurÀCréerOuMettreÀJourBuilder from '@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder';
import { getNextAuthSessionTokenPourUtilisateurEmail } from '@/server/infrastructure/test/NextAuthHelper';
import { dependencies } from '@/server/infrastructure/Dependencies';

jest.mock('@/server/import-indicateur/infrastructure/handlers/ParseForm', () => ({
  parseForm: () => ({
    file: mock<PersistentFile>(),
  }),
}));
jest.mock('@/server/import-indicateur/infrastructure/adapters/FichierService.ts', () => ({
  recupererFichier: () => 'fichierRécupéré',
  supprimerLeFichier: () => 'fichierSupprimé',
}));

const DONNEE_DATE_1 = '2023-12-30';
const DONNEE_DATE_2 = '31/12/2023';
const BASE_URL_VALIDATA = 'https://api.validata.etalab.studio';

describe('VerifierImportIndicateurHandler', () => {
  describe('Quand le fichier envoyé est correct', () => {
    it('doit retourner que le fichier est valide', async () => {
      // GIVEN
      const report = new ReportValidataBuilder()
        .avecValid(true)
        .avecTasks(
          new ReportTaskBuilder()
            .avecResource(
              new ReportResourceTaskBuilder()
                .avecData([
                  ['identifiant_indic', 'zone_id', 'date_valeur', 'type_valeur', 'valeur'],
                  ['IND-001', 'D001', DONNEE_DATE_1, 'vi', '9'],
                  ['IND-001', 'D004', DONNEE_DATE_2, 'vc', '3'],
                ])
                .build(),
            )
            .build(),
        ).build();

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').avecHabilitationsLecture([], [], []).build();
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur as any, 'test');

      nock(BASE_URL_VALIDATA)
        .post('/validate').reply(200,
          JSON.stringify({ report }),
        );

      // WHEN
      const formData = new FormData();
      const file = mock<File>();
      formData.append('file', file);

      const { req, res } = createMocks({
        method: 'POST',
        body: formData,
        cookies: {
          'next-auth.session-token': await getNextAuthSessionTokenPourUtilisateurEmail('ditp.admin@example.com'),
        },
        query: { indicateurId: 'IND-001' },
      });

      await handleVerifierFichierImportIndicateur(req, res);

      // THEN
      expect(res._getStatusCode()).toEqual(200);
      expect(res._getJSONData()).toStrictEqual({
        id: anyString(),
        estValide: true,
        listeErreursValidation: [],
      });
    });

    it('doit sauvegarder les données du fichier', async () => {
      // GIVEN
      const report = new ReportValidataBuilder()
        .avecValid(true)
        .avecTasks(
          new ReportTaskBuilder()
            .avecResource(
              new ReportResourceTaskBuilder()
                .avecData([
                  ['identifiant_indic', 'zone_id', 'date_valeur', 'type_valeur', 'valeur'],
                  ['IND-001', 'D001', DONNEE_DATE_1, 'vi', '9'],
                  ['IND-001', 'D004', DONNEE_DATE_2, 'vc', '3'],
                ])
                .build(),
            )
            .build(),
        ).build();
      nock(BASE_URL_VALIDATA)
        .post('/validate').reply(200,
          JSON.stringify({ report }),
        );

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').avecHabilitationsLecture([], [], []).build();
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur as any, 'test');

      const formData = new FormData();
      const file = mock<File>();
      formData.append('file', file);
      const { req, res } = createMocks({
        method: 'POST',
        body: formData,
        cookies: {
          'next-auth.session-token': await getNextAuthSessionTokenPourUtilisateurEmail('ditp.admin@example.com'),
        },
        query: { indicateurId: 'IND-001' },
      });

      // WHEN
      await handleVerifierFichierImportIndicateur(req, res);

      // THEN
      const listeDonneesFichier = await prisma.mesure_indicateur_temporaire.findMany({ orderBy: { indic_id: 'asc' } });
      expect(listeDonneesFichier).toHaveLength(2);
      expect(listeDonneesFichier[0].indic_id).toEqual('IND-001');
      expect(listeDonneesFichier[0].zone_id).toEqual('D001');
      expect(listeDonneesFichier[0].metric_date).toEqual(DONNEE_DATE_1);
      expect(listeDonneesFichier[0].metric_type).toEqual('vi');
      expect(listeDonneesFichier[0].metric_value).toEqual('9');

      expect(listeDonneesFichier[1].indic_id).toEqual('IND-001');
      expect(listeDonneesFichier[1].zone_id).toEqual('D004');
      expect(listeDonneesFichier[1].metric_date).toEqual('2023-12-31');
      expect(listeDonneesFichier[1].metric_type).toEqual('vc');
      expect(listeDonneesFichier[1].metric_value).toEqual('3');
    });

    it('doit sauvegarder le rapport pour lié à l\'utilisateur', async () => {
      // GIVEN
      const report = new ReportValidataBuilder()
        .avecValid(true)
        .avecTasks(
          new ReportTaskBuilder()
            .avecResource(
              new ReportResourceTaskBuilder()
                .avecData([
                  ['identifiant_indic', 'zone_id', 'date_valeur', 'type_valeur', 'valeur'],
                  ['IND-001', 'D001', DONNEE_DATE_1, 'vi', '9'],
                  ['IND-001', 'D004', DONNEE_DATE_2, 'vc', '3'],
                ])
                .build(),
            )
            .build(),
        ).build();
      nock(BASE_URL_VALIDATA)
        .post('/validate').reply(200,
          JSON.stringify({ report }),
        );

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').avecHabilitationsLecture([], [], []).build();
      await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur as any, 'test');

      const formData = new FormData();
      const file = mock<File>();
      formData.append('file', file);
      const { req, res } = createMocks({
        method: 'POST',
        body: formData,
        cookies: {
          'next-auth.session-token': await getNextAuthSessionTokenPourUtilisateurEmail('ditp.admin@example.com'),
        },
        query: { indicateurId: 'IND-001' },
      });

      // WHEN
      await handleVerifierFichierImportIndicateur(req, res);

      // THEN
      const listeRapport = await prisma.rapport_import_mesure_indicateur.findMany();
      expect(listeRapport).toHaveLength(1);

      expect(listeRapport[0].utilisateurEmail).toEqual('ditp.admin@example.com');
    });
  });

  it('Quand le fichier envoyé est incorrect, doit retourner les erreurs du fichier', async () => {
    // GIVEN
    const report = new ReportValidataBuilder()
      .avecValid(false)
      .avecTasks(
        new ReportTaskBuilder()
          .avecErrors(
            new ReportErrorTaskBuilder()
              .avecCell('cellule 1')
              .avecName('nom 1')
              .avecFieldName('nom du champ 1')
              .avecFieldPosition(1)
              .avecMessage('message 1')
              .avecRowNumber(1)
              .avecRowPosition(1)
              .build(),
            new ReportErrorTaskBuilder()
              .avecCell('cellule 2')
              .avecName('nom 2')
              .avecFieldName('nom du champ 2')
              .avecFieldPosition(2)
              .avecMessage('message 2')
              .avecRowNumber(2)
              .avecRowPosition(2)
              .build(),
          ).avecResource(
            new ReportResourceTaskBuilder()
              .avecData([
                ['identifiant_indic', 'zone_id', 'date_valeur', 'type_valeur', 'valeur'],
                ['IND-001', 'D001', '30/12/2023', 'vi', '9'],
                ['IND-001', 'D004', '31/12/2023', 'vc', '3'],
              ])
              .build(),
          )
          .build(),
      ).build();

    const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').avecHabilitationsLecture([], [], []).build();
    await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur as any, 'test');

    nock(BASE_URL_VALIDATA)
      .post('/validate').reply(200,
        JSON.stringify({ report }),
      );

    // WHEN
    const formData = new FormData();
    const file = mock<File>();
    formData.append('file', file);

    const { req, res } = createMocks({
      method: 'POST',
      body: formData,
      cookies: {
        'next-auth.session-token': await getNextAuthSessionTokenPourUtilisateurEmail('ditp.admin@example.com'),
      },
      query: { indicateurId: 'IND-001' },
    });
    await handleVerifierFichierImportIndicateur(req, res);

    // THEN
    expect(res._getStatusCode()).toEqual(200);
    expect(res._getJSONData()).toStrictEqual({
      id: anyString(),
      estValide: false,
      listeErreursValidation: [
        {
          cellule: 'cellule 1',
          nom: 'nom 1',
          message: 'message 1',
          numeroDeLigne: 1,
          positionDeLigne: 1,
          nomDuChamp: 'nom du champ 1',
          positionDuChamp: 1,
        },
        {
          cellule: 'cellule 2',
          nom: 'nom 2',
          message: 'message 2',
          numeroDeLigne: 2,
          positionDeLigne: 2,
          nomDuChamp: 'nom du champ 2',
          positionDuChamp: 2,
        },
      ],
    });
  });

  it('Quand le fichier envoyé est incorrect, doit sauvegarder les erreurs du fichier', async () => {
    // GIVEN
    const report = new ReportValidataBuilder()
      .avecValid(false)
      .avecTasks(
        new ReportTaskBuilder()
          .avecErrors(
            new ReportErrorTaskBuilder()
              .avecCell('cellule 1')
              .avecName('nom 1')
              .avecFieldName('nom du champ 1')
              .avecFieldPosition(1)
              .avecMessage('message 1')
              .avecRowNumber(1)
              .avecRowPosition(1)
              .build(),
            new ReportErrorTaskBuilder()
              .avecCell('cellule 2')
              .avecName('nom 2')
              .avecFieldName('nom du champ 2')
              .avecFieldPosition(2)
              .avecMessage('message 2')
              .avecRowNumber(2)
              .avecRowPosition(2)
              .build(),
          ).avecResource(
            new ReportResourceTaskBuilder()
              .avecData([
                ['identifiant_indic', 'zone_id', 'date_valeur', 'type_valeur', 'valeur'],
                ['IND-001', 'D001', '30/12/2023', 'vi', '9'],
                ['IND-001', 'D004', '31/12/2023', 'vc', '3'],
              ])
              .build(),
          )
          .build(),
      ).build();

    const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecEmail('ditp.admin@example.com').avecProfil('DITP_ADMIN').avecHabilitationsLecture([], [], []).build();
    await dependencies.getUtilisateurRepository().créerOuMettreÀJour(utilisateur as any, 'test');

    nock(BASE_URL_VALIDATA)
      .post('/validate').reply(200,
        JSON.stringify({ report }),
      );

    // WHEN
    const formData = new FormData();
    const file = mock<File>();
    formData.append('file', file);

    const { req, res } = createMocks({
      method: 'POST',
      body: formData,
      cookies: {
        'next-auth.session-token': await getNextAuthSessionTokenPourUtilisateurEmail('ditp.admin@example.com'),
      },
      query: { indicateurId: 'IND-001' },
    });
    await handleVerifierFichierImportIndicateur(req, res);

    // THEN
    expect(res._getStatusCode()).toEqual(200);
    const listeErreursValidationFichier = await prisma.erreur_validation_fichier.findMany();
    expect(listeErreursValidationFichier[0].cellule).toEqual('cellule 1');
    expect(listeErreursValidationFichier[0].nom).toEqual('nom 1');
    expect(listeErreursValidationFichier[0].message).toEqual('message 1');
    expect(listeErreursValidationFichier[0].numero_de_ligne).toEqual(1);
    expect(listeErreursValidationFichier[0].position_de_ligne).toEqual(1);
    expect(listeErreursValidationFichier[0].nom_du_champ).toEqual('nom du champ 1');
    expect(listeErreursValidationFichier[0].position_du_champ).toEqual(1);

    expect(listeErreursValidationFichier[1].cellule).toEqual('cellule 2');
    expect(listeErreursValidationFichier[1].nom).toEqual('nom 2');
    expect(listeErreursValidationFichier[1].message).toEqual('message 2');
    expect(listeErreursValidationFichier[1].numero_de_ligne).toEqual(2);
    expect(listeErreursValidationFichier[1].position_de_ligne).toEqual(2);
    expect(listeErreursValidationFichier[1].nom_du_champ).toEqual('nom du champ 2');
    expect(listeErreursValidationFichier[1].position_du_champ).toEqual(2);
  });
});
