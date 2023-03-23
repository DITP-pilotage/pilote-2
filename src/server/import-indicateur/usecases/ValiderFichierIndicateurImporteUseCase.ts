import {
  FichierIndicateurValidationService,
} from '@/server/import-indicateur/domain/ports/fichier-indicateur-validation.service';
import { DetailValidationFichier } from '@/server/import-indicateur/domain/detail-validation.fichier';

interface Dependencies {
  fichierIndicateurValidationService: FichierIndicateurValidationService
}

export class ValiderFichierIndicateurImporteUseCase {
  private fichierIndicateurValidationService: FichierIndicateurValidationService;

  constructor({ fichierIndicateurValidationService }: Dependencies) {
    this.fichierIndicateurValidationService = fichierIndicateurValidationService;
  }

  async execute({
    formDataBody,
    contentType,
  }: { formDataBody: FormData, contentType: string }): Promise<DetailValidationFichier> {
    return this.fichierIndicateurValidationService.validerFichier(formDataBody, contentType);
  }
}
