import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import { MesureIndicateurTemporaire } from '@/server/import-indicateur/domain/MesureIndicateurTemporaire';
import {
  ReportErrorTask,
  ReportTask,
  ReportValidata,
} from '@/server/import-indicateur/infrastructure/ReportValidata.interface';
import {
  FichierIndicateurValidationService,
  ValiderFichierPayload,
} from '@/server/import-indicateur/domain/ports/FichierIndicateurValidationService.interface';
import { HttpClient } from '@/server/import-indicateur/domain/ports/HttpClient.interface';
import { ErreurValidationFichier } from '@/server/import-indicateur/domain/ErreurValidationFichier';
import logger from '@/server/infrastructure/logger';

interface Dependencies {
  httpClient: HttpClient
}

const extraireLesDonnees = (task: ReportTask): string[][] => {
  const [, ...data] = task.resource.data;
  return data;
};

enum EnTeteFichierEnum {
  INDIC_ID = 'identifiant_indic',
  ZONE_ID = 'zone_id',
  METRIC_DATE = 'date_valeur',
  METRIC_TYPE = 'type_valeur',
  METRIC_VALUE = 'valeur',
}

interface PositionEnTeteDuFichier {
  indicId: number
  zoneId: number
  metricDate: number
  metricType: number
  metricValue: number
}

const recupererLesPositionsDesEnTetes = (rawEntete: string[]): PositionEnTeteDuFichier => {
  return {
    indicId: rawEntete.indexOf(EnTeteFichierEnum.INDIC_ID),
    zoneId: rawEntete.indexOf(EnTeteFichierEnum.ZONE_ID),
    metricDate: rawEntete.indexOf(EnTeteFichierEnum.METRIC_DATE),
    metricType: rawEntete.indexOf(EnTeteFichierEnum.METRIC_TYPE),
    metricValue: rawEntete.indexOf(EnTeteFichierEnum.METRIC_VALUE),
  };
};

const initialiserMapFieldNameErreurDITP: (taskError: ReportErrorTask) => Record<EnTeteFichierEnum.INDIC_ID | EnTeteFichierEnum.METRIC_TYPE | EnTeteFichierEnum.ZONE_ID | string, Record<string, string>> = (taskError) => ({
  [EnTeteFichierEnum.INDIC_ID]: {
    'constraint \"required\" is \"True\"': `Un indicateur ne peut etre vide. C'est le cas à la ligne ${taskError.rowPosition}.`,
    'constraint \"pattern\" is \"^IND-[0-9]{3}$\"': "L'identifiant de l'indicateur doit être renseigné dans le format IND-XXX. Vous pouvez vous référer au guide des indicateurs pour trouver l'identifiant de votre indicateur.",
  },
  [EnTeteFichierEnum.METRIC_TYPE]: {
    "constraint \"enum\" is \"['vi', 'va', 'vc']\"": 'Le type de valeur doit être vi (valeur initiale), va (valeur actuelle) ou vc (valeur cible).',
    "constraint \"enum\" is \"['va']\"": 'Le type de valeur doit être va (valeur actuelle). Vous ne pouvez saisir que des valeurs actuelles.',
  },
  [EnTeteFichierEnum.ZONE_ID]: {
    'constraint "pattern" is "^(R[0-9]{2,3})$"': `Veuillez entrer uniquement une zone régionale dans la colonne zone_id. '${taskError.cell}' n'est pas une zone régionale.`,
  },
});
const initialiserMapCodeErreurDITP: (taskError: ReportErrorTask) => Record<string, Record<string, string>> = (taskError) => {
  const mapCodeNote: Record<string, string> = {};
  const mapCodeNoteEnteteInvalide: Record<string, string> = {};
  const mapCodeNoteEnteteDoublon: Record<string, string> = {};

  const cléPourCodeLigneDuplique = 'Values in the primary key fields should be unique for every row';
  const cléPourCodeLigneVide = 'cells composing the primary keys are all "None"';
  mapCodeNote[cléPourCodeLigneDuplique] = `La ligne ${taskError.rowNumber} est vide ou comporte les mêmes zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez la modifier ou la supprimer.`;
  mapCodeNote[cléPourCodeLigneVide] = `Toutes les cellules de la ligne ${taskError.rowPosition} sont vides`;

  const cléPourCodeEnteteInvalide = 'Provided schema is not valid.';
  mapCodeNoteEnteteInvalide[cléPourCodeEnteteInvalide] = 'Les en-têtes du fichier sont invalides, les en-têtes doivent être [identifiant_indic, zone_id, date_valeur, type_valeur, valeur]';

  const cléPourCodeEnteteDoublon = 'Duplicate labels in header is not supported with "schema_sync"';
  mapCodeNoteEnteteDoublon[cléPourCodeEnteteDoublon] = 'Il existe des entêtes en doublon dans le fichier';

  return {
    'primary-key-error': mapCodeNote,
    'schema-error': mapCodeNoteEnteteInvalide,
    'general-error': mapCodeNoteEnteteDoublon,
  };
};
const personnaliserValidataMessage = (taskError: ReportErrorTask): string => {
  const fieldName = taskError.fieldName || 'unknown';
  const { note, code, message, description } = taskError;

  const mapFieldNameErreurDITP = initialiserMapFieldNameErreurDITP(taskError);
  if (mapFieldNameErreurDITP[fieldName] && mapFieldNameErreurDITP[fieldName][note]) {
    return mapFieldNameErreurDITP[fieldName][note];
  }

  const mapCodeErreurDITP = initialiserMapCodeErreurDITP(taskError);
  if (mapCodeErreurDITP[code] && (mapCodeErreurDITP[code][description] || mapCodeErreurDITP[code][note])) {
    return mapCodeErreurDITP[code][description] || mapCodeErreurDITP[code][note];
  }
  return message;
};

export class ValidataFichierIndicateurValidationService implements FichierIndicateurValidationService {
  private httpClient: HttpClient;

  constructor({ httpClient }: Dependencies) {
    this.httpClient = httpClient;
  }

  async validerFichier({
    cheminCompletDuFichier,
    nomDuFichier,
    schema,
    utilisateurEmail,
  }: ValiderFichierPayload): Promise<DetailValidationFichier> {
    let rapportValidata: ReportValidata;
    let rapport: DetailValidationFichier;

    let listeErreursValidation: ErreurValidationFichier[] = [];
    let listeIndicateursData: MesureIndicateurTemporaire[] = [];

    try {
      rapportValidata = await this.httpClient.post({ cheminCompletDuFichier, nomDuFichier, schema });
      rapport = DetailValidationFichier.creerDetailValidationFichier({ estValide: rapportValidata.valid, utilisateurEmail });


      const rawEnTete = rapportValidata.tasks[0].resource.data[0];

      rawEnTete.forEach(enTetes => {
        if (enTetes.trim() !== enTetes) {
          listeErreursValidation.push(ErreurValidationFichier.creerErreurValidationFichier({
            rapportId: rapport.id,
            cellule: enTetes,
            nom: 'En-tête incorrect',
            message: `Le champ de l'en-tête '${enTetes.trim()}' comporte des espaces, veuillez les supprimer`,
            numeroDeLigne: 0,
            positionDeLigne: 0,
            nomDuChamp: enTetes.trim(),
            positionDuChamp: 0,
          }));
        }
        if (enTetes.toLowerCase() !== enTetes) {
          listeErreursValidation.push(ErreurValidationFichier.creerErreurValidationFichier({
            rapportId: rapport.id,
            cellule: enTetes,
            nom: 'En-tête incorrect',
            message: `Le champ de l'en-tête '${enTetes.toLowerCase()}' comporte des majuscules, veuillez les mettre en minuscule`,
            numeroDeLigne: 0,
            positionDeLigne: 0,
            nomDuChamp: enTetes.toLowerCase(),
            positionDuChamp: 0,
          }));
        }
      });

      const enTetes = recupererLesPositionsDesEnTetes(rawEnTete);
      const donnees = rapportValidata.tasks.map(extraireLesDonnees);

      if ((rapportValidata.tasks[0].resource.data[0]).includes('identifiant_indic')) {
        listeIndicateursData = donnees.flat().map(donnee => MesureIndicateurTemporaire.createMesureIndicateurTemporaire({
          rapportId: rapport.id,
          indicId: donnee[enTetes.indicId],
          zoneId: donnee[enTetes.zoneId],
          metricDate: donnee[enTetes.metricDate],
          metricType: donnee[enTetes.metricType],
          metricValue: `${donnee[enTetes.metricValue]}`,
        }));
      } else {
        listeErreursValidation.push(ErreurValidationFichier.creerErreurValidationFichier({
          rapportId: rapport.id,
          cellule: 'identifiant_indic',
          nom: 'identifiant_indic',
          message: "L'en-tête identifiant_indic n'est pas présente",
          numeroDeLigne: 0,
          positionDeLigne: 0,
          nomDuChamp: 'identifiant_indic',
          positionDuChamp: 0,
        }));
      }

      const listeErreursReport = rapportValidata.tasks.flatMap(task => task.errors).map(taskError => ErreurValidationFichier.creerErreurValidationFichier({
        rapportId: rapport.id,
        cellule: taskError.cell || 'Cellule non définie',
        nom: taskError.name,
        message: personnaliserValidataMessage(taskError),
        numeroDeLigne: taskError.rowNumber || -1,
        positionDeLigne: taskError.rowPosition || -1,
        nomDuChamp: taskError.fieldName || '',
        positionDuChamp: taskError.fieldPosition || -1,
      }));

      listeErreursValidation = [...listeErreursValidation, ...listeErreursReport];

      rapport.affecterListeMesuresIndicateurTemporaire(listeIndicateursData);
      rapport.affecterListeErreursValidation(listeErreursValidation);

      return rapport;
    } catch (error) {
      rapport = DetailValidationFichier.creerDetailValidationFichier({ estValide: false, utilisateurEmail });
      listeErreursValidation.push(ErreurValidationFichier.creerErreurValidationFichier({
        rapportId: rapport.id,
        cellule: 'Cellule non définie',
        nom: 'Erreur non identifié',
        message: 'Une erreur est survenue lors de la validation du fichier',
        numeroDeLigne: 0,
        positionDeLigne: 0,
        nomDuChamp: '',
        positionDuChamp: 0,
      }));
      rapport.affecterListeErreursValidation(listeErreursValidation);
      logger.error((error as Error).message);

      return rapport;
    }
  }
}
