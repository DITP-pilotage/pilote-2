import { mock, MockProxy } from 'jest-mock-extended';
import {
  ValiderFichierIndicateurImporteUseCase,
} from '@/server/import-indicateur/usecases/ValiderFichierIndicateurImporteUseCase';
import { DetailValidationFichier } from '@/server/import-indicateur/domain/detail-validation.fichier';
import {
  FichierIndicateurValidationService,
} from '@/server/import-indicateur/domain/ports/fichier-indicateur-validation.service';

describe('ValiderFichierIndicateurImporteUseCase', () => {
  let fichierIndicateurValidationService: MockProxy<FichierIndicateurValidationService>;
  let validerFichierIndicateurImporteUseCase: ValiderFichierIndicateurImporteUseCase;

  beforeEach(() => {
    fichierIndicateurValidationService = mock<FichierIndicateurValidationService>();
    validerFichierIndicateurImporteUseCase = new ValiderFichierIndicateurImporteUseCase({ fichierIndicateurValidationService });
  });

  it("doit appeler le service de validation du fichier d'indicateur importé", async () => {
    // Given
    const detailValidationFichier = DetailValidationFichier.creerDetailValidationFichier({
      estValide: true,
    });
    const formDataBody = new FormData();
    const contentType = 'content-type';
    fichierIndicateurValidationService.validerFichier.calledWith(formDataBody, contentType).mockResolvedValue(detailValidationFichier);

    // When
    const result = await validerFichierIndicateurImporteUseCase.execute({
      formDataBody,
      contentType,
    });
    // Then
    expect(result.estValide).toEqual(true);
  });
});
