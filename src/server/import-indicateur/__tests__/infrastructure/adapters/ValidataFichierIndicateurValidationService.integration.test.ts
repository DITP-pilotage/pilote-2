import { mock, MockProxy } from 'jest-mock-extended';
import { HttpClient } from '@/server/import-indicateur/domain/ports/HttpClient';
import {
  ValidataFichierIndicateurValidationService,
} from '@/server/import-indicateur/infrastructure/adapters/ValidataFichierIndicateurValidationService';
import { ReportValidataBuilder } from '@/server/import-indicateur/app/builder/ReportValidataBuilder';
import { ReportResourceTaskBuilder, ReportTaskBuilder } from '@/server/import-indicateur/app/builder/ReportTaskBuilder';
import { ReportErrorTaskBuilder } from '@/server/import-indicateur/app/builder/ReportErrorTaskBuilder';
import { ValiderFichierPayload } from '@/server/import-indicateur/domain/ports/FichierIndicateurValidationService';

describe('ValidataFichierIndicateurValidationService', () => {
  let validataFichierIndicateurValidationService: ValidataFichierIndicateurValidationService;
  let httpClient: MockProxy<HttpClient>;

  const cheminCompletDuFichier = 'cheminCompletDuFichier';
  const nomDuFichier = 'nomDuFichier';
  const schema = 'schema';
  const metricDateValue1 = '30/12/2023';
  const metricDateValue2 = '31/12/2023';

  beforeEach(() => {
    httpClient = mock<HttpClient>();
    validataFichierIndicateurValidationService = new ValidataFichierIndicateurValidationService({ httpClient });
  });

  it('doit appeler le httpClient pour contacter validata', async () => {
    // GIVEN
    const body: ValiderFichierPayload = { cheminCompletDuFichier, nomDuFichier, schema };
    const report = new ReportValidataBuilder()
      .avecValid(true)
      .avecTasks(new ReportTaskBuilder()
        .avecResource(
          new ReportResourceTaskBuilder()
            .avecData([
              ['indic_id', 'zone_id', 'metric_date', 'metric_type', 'metric_value'],
              ['IND-001', 'D001', metricDateValue1, 'vi', '9'],
              ['IND-002', 'D004', metricDateValue2, 'vc', '3'],
            ])
            .build(),
        )
        .build(),
      )
      .build();

    httpClient.post.mockResolvedValue(report);

    // WHEN
    await validataFichierIndicateurValidationService.validerFichier(body);

    // THEN
    expect(httpClient.post).toHaveBeenNthCalledWith(1, body);
  });

  describe('quand le fichier est valide', () => {
    it('doit construire le rapport de validation du fichier', async () => {
      // GIVEN
      const body: ValiderFichierPayload = { cheminCompletDuFichier, nomDuFichier, schema };
      const report = new ReportValidataBuilder()
        .avecValid(true)
        .avecTasks(new ReportTaskBuilder()
          .avecResource(
            new ReportResourceTaskBuilder()
              .avecData([
                ['indic_id', 'zone_id', 'metric_date', 'metric_type', 'metric_value'],
                ['IND-001', 'D001', metricDateValue1, 'vi', '9'],
                ['IND-002', 'D004', metricDateValue2, 'vc', '3'],
              ])
              .build(),
          )
          .build(),
        )
        .build();

      httpClient.post.mockResolvedValue(report);

      // WHEN
      const result = await validataFichierIndicateurValidationService.validerFichier(body);

      // THEN
      expect(result.estValide).toEqual(true);

      expect(result.listeIndicateursData).toHaveLength(2);

      expect(result.listeIndicateursData[0].id).toBeDefined();
      expect(result.listeIndicateursData[0].indicId).toEqual('IND-001');
      expect(result.listeIndicateursData[0].metricDate).toEqual('30/12/2023');
      expect(result.listeIndicateursData[0].metricType).toEqual('vi');
      expect(result.listeIndicateursData[0].metricValue).toEqual('9');
      expect(result.listeIndicateursData[0].zoneId).toEqual('D001');

      expect(result.listeIndicateursData[1].id).toBeDefined();
      expect(result.listeIndicateursData[1].indicId).toEqual('IND-002');
      expect(result.listeIndicateursData[1].metricDate).toEqual('31/12/2023');
      expect(result.listeIndicateursData[1].metricType).toEqual('vc');
      expect(result.listeIndicateursData[1].metricValue).toEqual('3');
      expect(result.listeIndicateursData[1].zoneId).toEqual('D004');
    });

    it('quand les en-têtes sont dans un autre ordre, doit construire le même rapport de validation du fichier', async () => {
      // GIVEN
      const body: ValiderFichierPayload = { cheminCompletDuFichier, nomDuFichier, schema };
      const report = new ReportValidataBuilder()
        .avecValid(true)
        .avecTasks(new ReportTaskBuilder()
          .avecResource(
            new ReportResourceTaskBuilder()
              .avecData([
                ['metric_type', 'zone_id', 'metric_date', 'indic_id', 'metric_value'],
                ['vi', 'D001', metricDateValue1, 'IND-001', '9'],
                ['vc', 'D004', metricDateValue2, 'IND-002', '3'],
              ])
              .build(),
          )
          .build(),
        )
        .build();

      httpClient.post.mockResolvedValue(report);

      // WHEN
      const result = await validataFichierIndicateurValidationService.validerFichier(body);

      // THEN
      expect(result.estValide).toEqual(true);

      expect(result.listeIndicateursData).toHaveLength(2);

      expect(result.listeIndicateursData[0].id).toBeDefined();
      expect(result.listeIndicateursData[0].indicId).toEqual('IND-001');
      expect(result.listeIndicateursData[0].metricDate).toEqual(metricDateValue1);
      expect(result.listeIndicateursData[0].metricType).toEqual('vi');
      expect(result.listeIndicateursData[0].metricValue).toEqual('9');
      expect(result.listeIndicateursData[0].zoneId).toEqual('D001');

      expect(result.listeIndicateursData[1].id).toBeDefined();
      expect(result.listeIndicateursData[1].indicId).toEqual('IND-002');
      expect(result.listeIndicateursData[1].metricDate).toEqual(metricDateValue2);
      expect(result.listeIndicateursData[1].metricType).toEqual('vc');
      expect(result.listeIndicateursData[1].metricValue).toEqual('3');
      expect(result.listeIndicateursData[1].zoneId).toEqual('D004');
    });
  });

  describe('quand le fichier est invalide', () => {
    it("doit construire le rapport d'erreur du fichier", async () => {
      // GIVEN
      const body: ValiderFichierPayload = { cheminCompletDuFichier, nomDuFichier, schema };
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
                  ['IND-001', 'D001', metricDateValue1, 'vi', '9'],
                  ['IND-001', 'D004', metricDateValue2, 'vc', '3'],
                ])
                .build(),
            )
            .build(),
        )
        .build();

      httpClient.post.mockResolvedValue(report);

      // WHEN
      const result = await validataFichierIndicateurValidationService.validerFichier(body);

      // THEN
      expect(result.estValide).toEqual(false);
      expect(result.listeErreursValidation).toHaveLength(2);

      expect(result.listeErreursValidation.at(0)?.cellule).toEqual('cellule 1');
      expect(result.listeErreursValidation.at(0)?.nom).toEqual('nom 1');
      expect(result.listeErreursValidation.at(0)?.nomDuChamp).toEqual('nom du champ 1');
      expect(result.listeErreursValidation.at(0)?.positionDuChamp).toEqual(1);
      expect(result.listeErreursValidation.at(0)?.message).toEqual('message 1');
      expect(result.listeErreursValidation.at(0)?.numeroDeLigne).toEqual(1);
      expect(result.listeErreursValidation.at(0)?.positionDeLigne).toEqual(1);

      expect(result.listeErreursValidation.at(1)?.cellule).toEqual('cellule 2');
      expect(result.listeErreursValidation.at(1)?.nom).toEqual('nom 2');
      expect(result.listeErreursValidation.at(1)?.nomDuChamp).toEqual('nom du champ 2');
      expect(result.listeErreursValidation.at(1)?.positionDuChamp).toEqual(2);
      expect(result.listeErreursValidation.at(1)?.message).toEqual('message 2');
      expect(result.listeErreursValidation.at(1)?.numeroDeLigne).toEqual(2);
      expect(result.listeErreursValidation.at(1)?.positionDeLigne).toEqual(2);
    });

    describe('et que le rapport possèdes des erreurs spécifiques, doit personnaliser le message', () => {
      it.each([
        ['indic_id', 'constraint-error', 'constraint \"required\" is \"True\"', 1, "Un indicateur ne peut etre vide. C'est le cas à la ligne 1."],
        ['indic_id', 'constraint-error', 'constraint \"required\" is \"True\"', 2, "Un indicateur ne peut etre vide. C'est le cas à la ligne 2."],
        ['indic_id', 'constraint-error', 'constraint \"pattern\" is \"^IND-[0-9]{3}$\"', 2, "L'identifiant de l'indicateur doit être renseigné dans le format IND-XXX. Vous pouvez vous référer au guide des indicateurs pour trouver l'identifiant de votre indicateur."],
        ['indic_id', 'constraint-error', 'another message', 2, "message d'origine"],
        ['metric_type', 'constraint-error', "constraint \"enum\" is \"['vi', 'va', 'vc']\"", 2, 'Le type de valeur doit être vi (valeur initiale), va (valeur actuelle) ou vc (valeur cible).'],
        ['metric_type', 'constraint-error', "constraint \"enum\" is \"['va']\"",  2, 'Le type de valeur doit être va (valeur actuelle). Vous ne pouvez saisir que des valeurs actuelles.'],
        ['metric_type', 'constraint-error', 'another message', 2, "message d'origine"],
        ['zone_id', 'constraint-error', 'constraint "pattern" is "^(R[0-9]{2,3})$"',  2, "Veuillez entrer uniquement une zone régionale dans la colonne zone_id. 'F001' n'est pas une zone régionale."],
        ['zone_id', 'constraint-error', 'another message', 2, "message d'origine"],
        [null, 'primary-key-error', 'the same as in the row at position 2',  2, "La ligne 2 comporte la même zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez en supprimer une des deux."],
        [null, 'primary-key-error', 'the same as in the row at position 3',  3, "La ligne 3 comporte la même zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez en supprimer une des deux."],
        [null, 'primary-key-error', 'another message', 2, "message d'origine"],
      ])('pour le champ %s, le code %s et la note %s à la ligne %i', async (
        fieldName,
        code,
        note,
        rowPosition,
        expected,
      ) => {
        // GIVEN
        const body: ValiderFichierPayload = { cheminCompletDuFichier, nomDuFichier, schema };
        const report = new ReportValidataBuilder()
          .avecValid(false)
          .avecTasks(
            new ReportTaskBuilder()
              .avecErrors(
                new ReportErrorTaskBuilder()
                  .avecFieldName(fieldName)
                  .avecCode(code)
                  .avecMessage("message d'origine")
                  .avecNote(note)
                  .avecCell('F001')
                  .avecRowPosition(rowPosition)
                  .build(),
              )
              .avecResource(
                new ReportResourceTaskBuilder()
                  .avecData([
                    ['indic_id', 'zone_id', 'metric_date', 'metric_type', 'metric_value'],
                    ['IND-001', 'D001', metricDateValue1, 'vi', '9'],
                    ['IND-001', 'D004', metricDateValue2, 'vc', '3'],
                  ])
                  .build(),
              )
              .build(),
          )
          .build();

        httpClient.post.mockResolvedValue(report);

        // WHEN
        const result = await validataFichierIndicateurValidationService.validerFichier(body);

        expect(result.listeErreursValidation.at(0)?.message).toEqual(expected);
      });
    })


    it('quand le fichier possède des données, doit construire le remonter les données du fichier', async () => {
      // GIVEN
      const body: ValiderFichierPayload = { cheminCompletDuFichier, nomDuFichier, schema };
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
            )
            .avecResource(
              new ReportResourceTaskBuilder()
                .avecData([
                  ['indic_id', 'zone_id', 'metric_date', 'metric_type', 'metric_value'],
                  ['IND-001', 'D001', metricDateValue1, 'vi', '9'],
                  ['IND-001', 'D004', metricDateValue2, 'vc', '3'],
                ])
                .build(),
            )
            .build(),
        )
        .build();

      httpClient.post.mockResolvedValue(report);

      // WHEN
      const result = await validataFichierIndicateurValidationService.validerFichier(body);

      // THEN
      expect(result.listeErreursValidation).toHaveLength(1);
      expect(result.listeIndicateursData).toHaveLength(2);
    });
  });
});
