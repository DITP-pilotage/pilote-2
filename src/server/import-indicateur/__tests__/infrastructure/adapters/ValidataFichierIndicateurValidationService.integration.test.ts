import { mock, MockProxy } from 'jest-mock-extended';
import { HttpClient } from '@/server/import-indicateur/domain/ports/HttpClient';
import {
  ValidataFichierIndicateurValidationService,
} from '@/server/import-indicateur/infrastructure/adapters/ValidataFichierIndicateurValidationService';
import { ReportValidataBuilder } from '@/server/import-indicateur/app/builder/ReportValidataBuilder';
import { ReportResourceTaskBuilder, ReportTaskBuilder } from '@/server/import-indicateur/app/builder/ReportTaskBuilder';
import { ReportErrorTaskBuilder } from '@/server/import-indicateur/app/builder/ReportErrorTaskBuilder';

describe('ValidataFichierIndicateurValidationService', () => {
  let validataFichierIndicateurValidationService: ValidataFichierIndicateurValidationService;
  let httpClient: MockProxy<HttpClient>;

  const contentType = 'content-type';

  beforeEach(() => {
    httpClient = mock<HttpClient>();
    validataFichierIndicateurValidationService = new ValidataFichierIndicateurValidationService({ httpClient });
  });

  it('doit appeler le httpClient pour contacter validata', async () => {
    // GIVEN
    const formDataBody = new FormData();
    const body = { formDataBody, contentType };
    httpClient.post.mockResolvedValue(new ReportValidataBuilder().build());

    // WHEN
    await validataFichierIndicateurValidationService.validerFichier(formDataBody, contentType);

    // THEN
    expect(httpClient.post).toHaveBeenNthCalledWith(1, body);
  });

  it('quand le fichier est valide, doit construire le rapport de validation du fichier', async () => {
    // GIVEN
    const formDataBody = new FormData();
    const report = new ReportValidataBuilder()
      .avecValid(true)
      .avecTasks(new ReportTaskBuilder()
        .avecResource(
          new ReportResourceTaskBuilder()
            .avecData([
              ['indic_id', 'zone_id', 'metric_date', 'metric_type', 'metric_value'],
              ['IND-001', 'D001', '30/12/2023', 'vi', '9'],
              ['IND-002', 'D004', '31/12/2023', 'vc', '3'],
            ])
            .build(),
        )
        .build(),
      )
      .build();

    httpClient.post.mockResolvedValue(report);
 
    // WHEN
    const result = await validataFichierIndicateurValidationService.validerFichier(formDataBody, contentType);

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

  it("quand le fichier est invalide, doit construire le rapport d'erreur du fichier", async () => {
    // GIVEN
    const formDataBody = new FormData();
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
          )
          .build(),
      )
      .build();

    httpClient.post.mockResolvedValue(report);
 
    // WHEN
    const result = await validataFichierIndicateurValidationService.validerFichier(formDataBody, contentType);

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
});
