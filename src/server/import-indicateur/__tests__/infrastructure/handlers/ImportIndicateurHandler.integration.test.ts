import nock from 'nock';
import { createMocks } from 'node-mocks-http';
import { mock } from 'jest-mock-extended';
import PersistentFile from 'formidable/PersistentFile';
import { ReportValidataBuilder } from '@/server/import-indicateur/app/builder/ReportValidataBuilder';
import handleValiderFichierImportIndicateur
  from '@/server/import-indicateur/infrastructure/handlers/ImportIndicateurHandler';
import { ReportResourceTaskBuilder, ReportTaskBuilder } from '@/server/import-indicateur/app/builder/ReportTaskBuilder';
import { ReportErrorTaskBuilder } from '@/server/import-indicateur/app/builder/ReportErrorTaskBuilder';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';

jest.mock('@/server/import-indicateur/infrastructure/handlers/ParseForm', () => ({
  parseForm: () => ({
    file: mock<PersistentFile>(),
  }),
}));
jest.mock('@/server/import-indicateur/infrastructure/adapters/FichierService.ts', () => ({
  recupererFichier: () => 'fichierRécupéré',
  supprimerLeFichier: () => 'fichierSupprimé',
}));


const DONNEE_DATE_1 = '30/12/2023';
const DONNEE_DATE_2 = '31/12/2023';
const BASE_URL_VALIDATA = 'https://api.validata.etalab.studio';

describe('ImportIndicateurHandler', () => {
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
                  ['indic_id', 'zone_id', 'metric_date', 'metric_type', 'metric_value'],
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

      // WHEN
      const formData = new FormData();
      const file = mock<File>();
      formData.append('file', file);
      const { req, res } = createMocks({
        method: 'POST',
        body: formData,
        query: { indicateurId: 'IND-001' },
      });
      await handleValiderFichierImportIndicateur(req, res);

      // THEN
      expect(res._getStatusCode()).toEqual(200);
      expect(res._getJSONData()).toStrictEqual({
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
                  ['indic_id', 'zone_id', 'metric_date', 'metric_type', 'metric_value'],
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

      // WHEN
      const formData = new FormData();
      const file = mock<File>();
      formData.append('file', file);
      const { req, res } = createMocks({
        method: 'POST',
        body: formData,
        query: { indicateurId: 'IND-001' },
      });
      await handleValiderFichierImportIndicateur(req, res);

      // THEN
      const listeDonneesFichier = await prisma.mesure_indicateur.findMany({ orderBy: { indic_id: 'asc' } });
      expect(listeDonneesFichier).toHaveLength(2);
      expect(listeDonneesFichier[0].indic_id).toEqual('IND-001');
      expect(listeDonneesFichier[0].zone_id).toEqual('D001');
      expect(listeDonneesFichier[0].metric_date).toEqual(DONNEE_DATE_1);
      expect(listeDonneesFichier[0].metric_type).toEqual('vi');
      expect(listeDonneesFichier[0].metric_value).toEqual('9');
      
      expect(listeDonneesFichier[1].indic_id).toEqual('IND-001');
      expect(listeDonneesFichier[1].zone_id).toEqual('D004');
      expect(listeDonneesFichier[1].metric_date).toEqual(DONNEE_DATE_2);
      expect(listeDonneesFichier[1].metric_type).toEqual('vc');
      expect(listeDonneesFichier[1].metric_value).toEqual('3');
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
                ['indic_id', 'zone_id', 'metric_date', 'metric_type', 'metric_value'],
                ['IND-001', 'D001', '30/12/2023', 'vi', '9'],
                ['IND-001', 'D004', '31/12/2023', 'vc', '3'],
              ])
              .build(),
          )
          .build(),
      ).build();

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
      query: { indicateurId: 'IND-001' },
    });
    await handleValiderFichierImportIndicateur(req, res);

    // THEN
    expect(res._getStatusCode()).toEqual(200);
    expect(res._getJSONData()).toStrictEqual({
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
});
