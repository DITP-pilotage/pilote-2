import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import {
  FichierIndicateurValidationService,
} from '@/server/import-indicateur/domain/ports/FichierIndicateurValidationService.interface';
import {
  MesureIndicateurTemporaireRepository,
} from '@/server/import-indicateur/domain/ports/MesureIndicateurTemporaireRepository.interface';
import { ErreurValidationFichier } from '@/server/import-indicateur/domain/ErreurValidationFichier';

import { RapportRepository } from '@/server/import-indicateur/domain/ports/RapportRepository';

interface Dependencies {
  fichierIndicateurValidationService: FichierIndicateurValidationService
  mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository
  rapportRepository: RapportRepository;
}

export class VerifierFichierIndicateurImporteUseCase {
  private fichierIndicateurValidationService: FichierIndicateurValidationService;

  private mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository;

  private rapportRepository: RapportRepository;


  constructor({ fichierIndicateurValidationService, mesureIndicateurTemporaireRepository, rapportRepository }: Dependencies) {
    this.fichierIndicateurValidationService = fichierIndicateurValidationService;
    this.mesureIndicateurTemporaireRepository = mesureIndicateurTemporaireRepository;
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
    await this.rapportRepository.sauvegarder(report);

    const listeErreursValidation: ErreurValidationFichier[] = report.listeErreursValidation;

    report.listeMesuresIndicateurTemporaire.forEach((mesureIndicateurTemporaire, index) => {
      if (mesureIndicateurTemporaire.indicId?.localeCompare(indicateurId)) {
        listeErreursValidation.push(
          ErreurValidationFichier.creerErreurValidationFichier({
            cellule: mesureIndicateurTemporaire.indicId,
            nom: 'Indicateur invalide',
            message: `L'indicateur ${mesureIndicateurTemporaire.indicId} ne correpond pas à l'indicateur choisit (${indicateurId})`,
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
      await this.mesureIndicateurTemporaireRepository.sauvegarder(report.listeMesuresIndicateurTemporaire);
    }


    return report;
  }
}
