import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import {
  FichierIndicateurValidationService,
} from '@/server/import-indicateur/domain/ports/FichierIndicateurValidationService';
import { MesureIndicateurRepository } from '@/server/import-indicateur/domain/ports/MesureIndicateurRepository';
import {
  ErreurValidationFichier,
} from '@/server/import-indicateur/infrastructure/adapters/ValidataFichierIndicateurValidationService';

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

  async execute(payload: {
    cheminCompletDuFichier: string
    nomDuFichier: string
    schema: string
    indicateurId: string
  }): Promise<DetailValidationFichier> {
    const report = await this.fichierIndicateurValidationService.validerFichier(payload);

    const listeErreursValidation: ErreurValidationFichier[] = [];
    report.listeIndicateursData.forEach((indicateurData, index) => {
      if (indicateurData.indicId.localeCompare(payload.indicateurId)) {
        listeErreursValidation.push(
          ErreurValidationFichier.creerErreurValidationFichier({
            cellule: indicateurData.indicId,
            nom: 'INDICATEUR_ERROR',
            message: `L'indicateur ${indicateurData.indicId} ne correpond pas à l'indicateur choisit (${payload.indicateurId})`,
            numeroDeLigne: index + 1,
            positionDeLigne: index,
            nomDuChamp: 'indic_id',
            positionDuChamp: -1,
          }),
        );
      }
    });

    if (listeErreursValidation.length > 0) {
      return DetailValidationFichier.creerDetailValidationFichier({
        estValide: false,
        listeErreursValidation,
      });
    }

    if (report.estValide) {
      await this.mesureIndicateurRepository.sauvegarder(report.listeIndicateursData);
    }
    return report;
  }
}
