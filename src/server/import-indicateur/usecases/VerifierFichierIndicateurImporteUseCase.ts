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
import { IndicateurRepository } from '@/server/import-indicateur/domain/ports/IndicateurRepository';

interface Dependencies {
  fichierIndicateurValidationService: FichierIndicateurValidationService
  mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository
  erreurValidationFichierRepository: ErreurValidationFichierRepository
  indicateurRepository: IndicateurRepository
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

const verifierDateValide = (mesureIndicateurTemporaire: MesureIndicateurTemporaire, listeErreursValidation: ErreurValidationFichier[], reportId: string, index: number) => {
  if (mesureIndicateurTemporaire.metricDate) {
    const tmpDate = new Date(mesureIndicateurTemporaire.metricDate).toISOString().split('T')[0];
    if (tmpDate !== mesureIndicateurTemporaire.metricDate) {
      listeErreursValidation.push(
        ErreurValidationFichier.creerErreurValidationFichier({
          rapportId: reportId,
          cellule: mesureIndicateurTemporaire.metricDate,
          nom: 'Date invalide',
          message: `La date '${mesureIndicateurTemporaire.metricDate}' n'est pas une date valide`,
          numeroDeLigne: index + 1,
          positionDeLigne: index,
          nomDuChamp: 'date_valeur',
          positionDuChamp: -1,
        }),
      );
    }
  }
};
 
const verifierFormatDateValeur = (mesureIndicateurTemporaire: MesureIndicateurTemporaire) => {
  if (mesureIndicateurTemporaire.metricDate?.match(/^([0-2]?\d|3[01])\/(0?\d|1[0-2])\/(20\d{2})$/)) {
    mesureIndicateurTemporaire.convertirDateProvenantDuFormat(ACCEPTED_DATE_FORMAT.DD_MM_YYYY);
  }
  if (mesureIndicateurTemporaire.metricDate?.match(/^(0?\d|1[0-2])-(([0-2]?\d|3[01])-\d{2})$/)) {
    mesureIndicateurTemporaire.convertirDateProvenantDuFormat(ACCEPTED_DATE_FORMAT.MM_DD_YY);
  }
};
const verifierFormatTypeValeur = (mesureIndicateurTemporaire: MesureIndicateurTemporaire) => {
  mesureIndicateurTemporaire.mettreTypeValeurEnMinuscule();
};
const verifierFormatZoneId = (mesureIndicateurTemporaire: MesureIndicateurTemporaire) => {
  mesureIndicateurTemporaire.mettreZoneIdEnMajuscule();
};

const DEFAULT_SCHEMA = 'sans-contraintes.json';

export class VerifierFichierIndicateurImporteUseCase {
  private fichierIndicateurValidationService: FichierIndicateurValidationService;

  private mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository;

  private erreurValidationFichierRepository: ErreurValidationFichierRepository;

  private indicateurRepository: IndicateurRepository;

  private rapportRepository: RapportRepository;

  constructor({
    fichierIndicateurValidationService,
    mesureIndicateurTemporaireRepository,
    erreurValidationFichierRepository,
    indicateurRepository,
    rapportRepository,
  }: Dependencies) {
    this.fichierIndicateurValidationService = fichierIndicateurValidationService;
    this.mesureIndicateurTemporaireRepository = mesureIndicateurTemporaireRepository;
    this.erreurValidationFichierRepository = erreurValidationFichierRepository;
    this.indicateurRepository = indicateurRepository;
    this.rapportRepository = rapportRepository;
  }

  async execute({
    cheminCompletDuFichier,
    nomDuFichier,
    baseSchemaUrl,
    indicateurId,
    utilisateurAuteurDeLimportEmail,
    isAdmin = false,
  }: {
    cheminCompletDuFichier: string
    nomDuFichier: string
    baseSchemaUrl: string
    indicateurId: string
    utilisateurAuteurDeLimportEmail: string
    isAdmin?: boolean
  }): Promise<DetailValidationFichier> {

    const informationIndicateur = await this.indicateurRepository.recupererInformationIndicateurParId(indicateurId);

    const schema = !informationIndicateur?.indicSchema || isAdmin ? DEFAULT_SCHEMA : informationIndicateur?.indicSchema;

    const report = await this.fichierIndicateurValidationService.validerFichier({
      cheminCompletDuFichier,
      nomDuFichier,
      schema: `${baseSchemaUrl}${schema}`,
      utilisateurEmail: utilisateurAuteurDeLimportEmail,
    });
    await this.rapportRepository.sauvegarder(report);

    try {
      report.listeMesuresIndicateurTemporaire.forEach((mesureIndicateurTemporaire, index) => {
        correspondALIndicateurId(mesureIndicateurTemporaire, indicateurId, report.id, report.listeErreursValidation, index);
        verifierFormatDateValeur(mesureIndicateurTemporaire);
        verifierDateValide(mesureIndicateurTemporaire, report.listeErreursValidation, report.id, index);
        verifierFormatTypeValeur(mesureIndicateurTemporaire);
        verifierFormatZoneId(mesureIndicateurTemporaire);
      });

      if (report.estValide && report.listeErreursValidation.length === 0) {
        await this.mesureIndicateurTemporaireRepository.sauvegarder(report.listeMesuresIndicateurTemporaire);
        return report;
      } else {
        await this.erreurValidationFichierRepository.sauvegarder(report.listeErreursValidation);
        return DetailValidationFichier.creerDetailValidationFichier({
          estValide: false,
          listeErreursValidation: report.listeErreursValidation,
          utilisateurEmail: utilisateurAuteurDeLimportEmail,
        });
      }
    } catch {
      const listeErreursValidation = [
        ErreurValidationFichier.creerErreurValidationFichier({
          rapportId: report.id,
          cellule: 'Cellule non définie',
          nom: 'Erreur non identifié',
          message: 'Une erreur est survenue lors de la validation du contenu du fichier',
          numeroDeLigne: 0,
          positionDeLigne: 0,
          nomDuChamp: '',
          positionDuChamp: 0,
        }),
      ];
      await this.erreurValidationFichierRepository.sauvegarder(listeErreursValidation);
      return DetailValidationFichier.creerDetailValidationFichier({
        estValide: false,
        listeErreursValidation,
        utilisateurEmail: utilisateurAuteurDeLimportEmail,
      });
    }
  }
}
