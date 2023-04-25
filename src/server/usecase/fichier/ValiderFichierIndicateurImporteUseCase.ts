import { DetailValidationFichier } from '@/server/domain/fichier/DetailValidationFichier';
import { FichierIndicateurValidationService } from '@/server/domain/fichier/FichierIndicateurValidationService.interface';
import { MesureIndicateurRepository } from '@/server/import-indicateur/domain/ports/MesureIndicateurRepository';
import { ErreurValidationFichier } from '@/server/import-indicateur/infrastructure/adapters/ValidataFichierIndicateurValidationService';

export class ValiderFichierIndicateurImporteUseCase {
  constructor(
    private readonly fichierIndicateurValidationService: FichierIndicateurValidationService,
    private readonly mesureIndicateurRepository: MesureIndicateurRepository,
  ) {}

  async execute(payload: {
    cheminCompletDuFichier: string
    nomDuFichier: string
    schema: string
    indicateurId: string
  }): Promise<DetailValidationFichier> {
    const report = await this.fichierIndicateurValidationService.validerFichier(payload);

    const listeErreursValidation: ErreurValidationFichier[] = report.listeErreursValidation;

    report.listeIndicateursData.forEach((indicateurData, index) => {
      if (indicateurData.indicId.localeCompare(payload.indicateurId)) {
        listeErreursValidation.push(
          ErreurValidationFichier.creerErreurValidationFichier({
            cellule: indicateurData.indicId,
            nom: 'Indicateur invalide',
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
