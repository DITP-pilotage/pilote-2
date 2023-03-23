import { mock, MockProxy } from 'jest-mock-extended';
import { HttpClient } from '@/server/import-indicateur/domain/ports/HttpClient';
import {
  ValidataFichierIndicateurValidationService,
} from '@/server/import-indicateur/infrastructure/adapters/ValidataFichierIndicateurValidationService';
import { ReportErrorTask, ReportTask, ReportValidata } from '@/server/import-indicateur/infrastructure/ReportValidata.interface';
import { ReportValidataBuilder } from '@/server/import-indicateur/app/builder/ReportValidataBuilder';

class ReportTaskBuilder {
  private errors: ReportErrorTask[] = [];

  avecErrors(...errors: ReportErrorTask[]): ReportTaskBuilder {
    this.errors = errors;

    return this;
  }

  build(): ReportTask {
    return {
      errors: this.errors,
    };
  }
}

class ReportErrorTaskBuilder {
  private cell: string = 'Ma cellule';

  private fieldName: string = 'Mon fieldName';

  private fieldNumber: number = 3;

  private fieldPosition: number = 3;

  private message: string = 'La valeur ne doit comporter que des chiffres et le point comme séparateur décimal.';

  private name: string = 'Format de nombre incorrect';

  private rowNumber: number = 3;

  private rowPosition: number = 3;

  avecCell(cell: string): ReportErrorTaskBuilder {
    this.cell = cell;

    return this;
  }

  avecFieldName(fieldName: string): ReportErrorTaskBuilder {
    this.fieldName = fieldName;

    return this;
  }

  avecFieldNumber(fieldNumber: number): ReportErrorTaskBuilder {
    this.fieldNumber = fieldNumber;

    return this;
  }

  avecFieldPosition(fieldPosition: number): ReportErrorTaskBuilder {
    this.fieldPosition = fieldPosition;

    return this;
  }

  avecMessage(message: string): ReportErrorTaskBuilder {
    this.message = message;

    return this;
  }

  avecName(name: string): ReportErrorTaskBuilder {
    this.name = name;

    return this;
  }

  avecRowNumber(rowNumber: number): ReportErrorTaskBuilder {
    this.rowNumber = rowNumber;

    return this;
  }

  avecRowPosition(rowPosition: number): ReportErrorTaskBuilder {
    this.rowPosition = rowPosition;

    return this;
  }

  build(): ReportErrorTask {
    return {
      cell: this.cell,
      fieldName: this.fieldName,
      fieldNumber: this.fieldNumber,
      fieldPosition: this.fieldPosition,
      message: this.message,
      name: this.name,
      rowNumber: this.rowNumber,
      rowPosition: this.rowPosition,
    };
  }
}

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
    const report: ReportValidata = {
      valid: true,
    };
    httpClient.post.mockResolvedValue(report);
 
    // WHEN
    const result = await validataFichierIndicateurValidationService.validerFichier(formDataBody, contentType);

    // THEN
    expect(result.estValide).toEqual(true);
  });

  it("quand le fichier est invalide, doit construire le rapport d'erreur du fichier", async () => {
    // GIVEN
    const formDataBody = new FormData();
    const report = new ReportValidataBuilder()
      .avecValid(false)
      .avecTasks(
        new ReportTaskBuilder()
          .avecErrors(
            new ReportErrorTaskBuilder().avecCell('cellule 1').build(),
            new ReportErrorTaskBuilder().avecCell('cellule 2').build(),
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
    expect(result.listeErreursValidation.at(1)?.cellule).toEqual('cellule 2');
  });
});
