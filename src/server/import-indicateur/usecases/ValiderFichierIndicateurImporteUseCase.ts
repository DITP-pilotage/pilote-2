import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import {
  FichierIndicateurValidationService,
} from '@/server/import-indicateur/domain/ports/FichierIndicateurValidationService';
import { MesureIndicateurRepository } from '@/server/import-indicateur/domain/ports/MesureIndicateurRepository';

interface Dependencies {
  fichierIndicateurValidationService: FichierIndicateurValidationService
  mesureIndicateurRepository: MesureIndicateurRepository
}

export class ValiderFichierIndicateurImporteUseCase {
  private fichierIndicateurValidationService: FichierIndicateurValidationService;

  private mesureIndicateurRepository: MesureIndicateurRepository;

  constructor({ fichierIndicateurValidationService, mesureIndicateurRepository }: Dependencies) {
    this.fichierIndicateurValidationService = fichierIndicateurValidationService;
    this.mesureIndicateurRepository = mesureIndicateurRepository;
  }

  async execute({
    formDataBody,
    contentType,
  }: { formDataBody: FormData, contentType: string }): Promise<DetailValidationFichier> {
    const report = await this.fichierIndicateurValidationService.validerFichier(formDataBody, contentType);
    if (report.estValide) {
      await this.mesureIndicateurRepository.sauvegarder(report.listeIndicateursData);
    }
    return report;
  }
}
