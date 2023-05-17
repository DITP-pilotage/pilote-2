import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import { FichierIndicateurValidationService } from '@/server/import-indicateur/domain/ports/FichierIndicateurValidationService.interface';
import { MesureIndicateurRepository } from '@/server/import-indicateur/domain/ports/MesureIndicateurRepository.interface';
import { ErreurValidationFichier } from '@/server/import-indicateur/domain/ErreurValidationFichier';

import { RapportRepository } from '@/server/import-indicateur/domain/ports/RapportRepository';

interface Dependencies {
  fichierIndicateurValidationService: FichierIndicateurValidationService
  mesureIndicateurRepository: MesureIndicateurRepository
  rapportRepository: RapportRepository;
}

export class ValiderFichierIndicateurImporteUseCase {
  private fichierIndicateurValidationService: FichierIndicateurValidationService;

  private mesureIndicateurRepository: MesureIndicateurRepository;
  
  private rapportRepository: RapportRepository;


  constructor({ fichierIndicateurValidationService, mesureIndicateurRepository, rapportRepository }: Dependencies) {
    this.fichierIndicateurValidationService = fichierIndicateurValidationService;
    this.mesureIndicateurRepository = mesureIndicateurRepository;
    this.rapportRepository = rapportRepository;
  }

  async execute({
    cheminCompletDuFichier,
    nomDuFichier,
    schema,
    indicateurId,
    utilisateurAuteurDeLimportEmail,
  }: {
    cheminCompletDuFichier: string
    nomDuFichier: string
    schema: string
    indicateurId: string
    utilisateurAuteurDeLimportEmail: string
  }): Promise<DetailValidationFichier> {
    const report = await this.fichierIndicateurValidationService.validerFichier({
      cheminCompletDuFichier,
      nomDuFichier,
      schema,
      utilisateurEmail: utilisateurAuteurDeLimportEmail,
    });

    const listeErreursValidation: ErreurValidationFichier[] = report.listeErreursValidation;

    report.listeIndicateursData.forEach((indicateurData, index) => {
      if (indicateurData.indicId.localeCompare(indicateurId)) {
        listeErreursValidation.push(
          ErreurValidationFichier.creerErreurValidationFichier({
            cellule: indicateurData.indicId,
            nom: 'Indicateur invalide',
            message: `L'indicateur ${indicateurData.indicId} ne correpond pas à l'indicateur choisit (${indicateurId})`,
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
        utilisateurEmail: utilisateurAuteurDeLimportEmail,
      });
    }

    if (report.estValide) {
      await this.mesureIndicateurRepository.sauvegarder(report.listeIndicateursData);
    }
    
    await this.rapportRepository.sauvegarder(report);

    return report;
  }
}
