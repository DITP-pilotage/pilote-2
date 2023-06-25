import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import {
  FichierIndicateurValidationService,
} from '@/server/import-indicateur/domain/ports/FichierIndicateurValidationService.interface';
import {
  MesureIndicateurTemporaireRepository,
} from '@/server/import-indicateur/domain/ports/MesureIndicateurTemporaireRepository.interface';
import { ErreurValidationFichier } from '@/server/import-indicateur/domain/ErreurValidationFichier';

import { RapportRepository } from '@/server/import-indicateur/domain/ports/RapportRepository';
import { MesureIndicateurTemporaire } from '@/server/import-indicateur/domain/MesureIndicateurTemporaire';
import { ACCEPTED_DATE_FORMAT } from '@/server/import-indicateur/domain/enum/ACCEPTED_DATE_FORMAT';
import {
  ErreurValidationFichierRepository,
} from '@/server/import-indicateur/domain/ports/ErreurValidationFichierRepository';

interface Dependencies {
  fichierIndicateurValidationService: FichierIndicateurValidationService
  mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository
  erreurValidationFichierRepository: ErreurValidationFichierRepository
  rapportRepository: RapportRepository;
}

const correspondALIndicateurId = (mesureIndicateurTemporaire: MesureIndicateurTemporaire, indicateurId: string, rapportId: string, listeErreursValidation: ErreurValidationFichier[], index: number) => {
  if (mesureIndicateurTemporaire.indicId?.localeCompare(indicateurId)) {
    listeErreursValidation.push(
      ErreurValidationFichier.creerErreurValidationFichier({
        rapportId: rapportId,
        cellule: mesureIndicateurTemporaire.indicId,
        nom: 'Indicateur invalide',
        message: `L'indicateur ${mesureIndicateurTemporaire.indicId} ne correpond pas à l'indicateur choisis (${indicateurId})`,
        numeroDeLigne: index + 1,
        positionDeLigne: index,
        nomDuChamp: 'indic_id',
        positionDuChamp: -1,
      }),
    );
  }
};

const verifierFormatDateValeur = (mesureIndicateurTemporaire: MesureIndicateurTemporaire) => {
  if (mesureIndicateurTemporaire.metricDate?.match('^(0[0-9]|1[0-9]|2[0-9]|3[01])\/(0[0-9]|1[012])\/(20[0-9]{2})$')) {
    mesureIndicateurTemporaire.convertirDateProvenantDuFormat(ACCEPTED_DATE_FORMAT.DD_MM_YYYY);
  }
  if (mesureIndicateurTemporaire.metricDate?.match('^(0[0-9]|1[012])-((0[0-9]|1[0-9]|2[0-9]|3[01])-[0-9]{2})$')) {
    mesureIndicateurTemporaire.convertirDateProvenantDuFormat(ACCEPTED_DATE_FORMAT.MM_DD_YY);
  }
};
const verifierFormatTypeValeur = (mesureIndicateurTemporaire: MesureIndicateurTemporaire) => {
  mesureIndicateurTemporaire.mettreTypeValeurEnMinuscule();
};
const verifierFormatZoneId = (mesureIndicateurTemporaire: MesureIndicateurTemporaire) => {
  mesureIndicateurTemporaire.mettreZoneIdEnMajuscule();
};

export class VerifierFichierIndicateurImporteUseCase {
  private fichierIndicateurValidationService: FichierIndicateurValidationService;

  private mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository;

  private erreurValidationFichierRepository: ErreurValidationFichierRepository;

  private rapportRepository: RapportRepository;


  constructor({
    fichierIndicateurValidationService,
    mesureIndicateurTemporaireRepository,
    erreurValidationFichierRepository,
    rapportRepository,
  }: Dependencies) {
    this.fichierIndicateurValidationService = fichierIndicateurValidationService;
    this.mesureIndicateurTemporaireRepository = mesureIndicateurTemporaireRepository;
    this.erreurValidationFichierRepository = erreurValidationFichierRepository;
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
      correspondALIndicateurId(mesureIndicateurTemporaire, indicateurId, report.id, listeErreursValidation, index);
      verifierFormatDateValeur(mesureIndicateurTemporaire); // déplacer dans le service
      verifierFormatTypeValeur(mesureIndicateurTemporaire); // déplacer dans le service
      verifierFormatZoneId(mesureIndicateurTemporaire); // déplacer dans le service
    });

    if (report.estValide && report.listeErreursValidation.length === 0) {
      await this.mesureIndicateurTemporaireRepository.sauvegarder(report.listeMesuresIndicateurTemporaire);
      return report;
    } else {
      await this.erreurValidationFichierRepository.sauvegarder(report.listeErreursValidation);
      return DetailValidationFichier.creerDetailValidationFichier({
        estValide: false,
        listeErreursValidation,
        utilisateurEmail: utilisateurAuteurDeLimportEmail,
      });
    }
  }
}
