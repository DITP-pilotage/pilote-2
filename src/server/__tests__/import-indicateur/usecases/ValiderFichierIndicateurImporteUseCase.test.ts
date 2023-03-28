import { mock, MockProxy } from 'jest-mock-extended';
import {
  ValiderFichierIndicateurImporteUseCase,
} from '@/server/import-indicateur/usecases/ValiderFichierIndicateurImporteUseCase';
import { FichierIndicateurValidationService } from '@/server/import-indicateur/domain/ports/FichierIndicateurValidationService';
import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';

describe('ValiderFichierIndicateurImporteUseCase', () => {
  let fichierIndicateurValidationService: MockProxy<FichierIndicateurValidationService>;
  let validerFichierIndicateurImporteUseCase: ValiderFichierIndicateurImporteUseCase;

  beforeEach(() => {
    fichierIndicateurValidationService = mock<FichierIndicateurValidationService>();
    validerFichierIndicateurImporteUseCase = new ValiderFichierIndicateurImporteUseCase({ fichierIndicateurValidationService });
  });

  it("doit appeler le service de validation du fichier d'indicateur importé", async () => {
    // GIVEN
    const detailValidationFichier = DetailValidationFichier.creerDetailValidationFichier({
      estValide: true,
    });
    const formDataBody = new FormData();
    const contentType = 'content-type';
    fichierIndicateurValidationService.validerFichier.calledWith(formDataBody, contentType).mockResolvedValue(detailValidationFichier);

    // WHEN
    const result = await validerFichierIndicateurImporteUseCase.execute({
      formDataBody,
      contentType,
    });

    // THEN
    expect(result.estValide).toEqual(true);
  });
});
