import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import { MesureIndicateurTemporaire } from '@/server/import-indicateur/domain/MesureIndicateurTemporaire';
import {
  ReportErrorTask,
  ReportResourceTaskData,
  ReportTask,
} from '@/server/import-indicateur/infrastructure/ReportValidata.interface';
import { FichierIndicateurValidationService, ValiderFichierPayload } from '@/server/import-indicateur/domain/ports/FichierIndicateurValidationService.interface';
import { HttpClient } from '@/server/import-indicateur/domain/ports/HttpClient.interface';
import { ErreurValidationFichier } from '@/server/import-indicateur/domain/ErreurValidationFichier';

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

const recupererLesPositionsDesEnTetes = (donnees: ReportResourceTaskData): PositionEnTeteDuFichier => {
  const enTetes = donnees[0];
  return {
    indicId: enTetes.indexOf(EnTeteFichierEnum.INDIC_ID),
    zoneId: enTetes.indexOf(EnTeteFichierEnum.ZONE_ID),
    metricDate: enTetes.indexOf(EnTeteFichierEnum.METRIC_DATE),
    metricType: enTetes.indexOf(EnTeteFichierEnum.METRIC_TYPE),
    metricValue: enTetes.indexOf(EnTeteFichierEnum.METRIC_VALUE),
  };
};

const extraireLeContenuDuFichier = (tasks: ReportTask[]) => {
  const enTetes = recupererLesPositionsDesEnTetes(tasks[0].resource.data);
  const donnees = tasks.map(extraireLesDonnees);

  return { enTetes, donnees };
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

  const cléPourCodeLigneDuplique = 'Values in the primary key fields should be unique for every row';
  mapCodeNote[cléPourCodeLigneDuplique] = `La ligne ${taskError.rowNumber} comporte la même zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez en supprimer une des deux.`;

  const cléPourCodeEnteteInvalide = 'Provided schema is not valid.';
  mapCodeNoteEnteteInvalide[cléPourCodeEnteteInvalide] = 'Les entêtes du fichier sont invalide, les entêtes doivent être [identifiant_indic, zone_id, date_valeur, type_valeur, valeur]';
  return {
    'primary-key-error': mapCodeNote,
    'schema-error': mapCodeNoteEnteteInvalide,
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
  if (mapCodeErreurDITP[code] && mapCodeErreurDITP[code][description]) {
    return mapCodeErreurDITP[code][description];
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
    const report = await this.httpClient.post({ cheminCompletDuFichier, nomDuFichier, schema });
    let listeIndicateursData: MesureIndicateurTemporaire[] = [];
    let listeErreursValidation: ErreurValidationFichier[] = [];

    const rapport =  DetailValidationFichier.creerDetailValidationFichier({ estValide: report.valid, utilisateurEmail });

    if (report.tasks[0].resource.data[0].includes('identifiant_indic')) {
      const { enTetes, donnees } = extraireLeContenuDuFichier(report.tasks);

      listeIndicateursData = donnees.flat().map(donnee => MesureIndicateurTemporaire.createMesureIndicateurTemporaire({
        rapportId: rapport.id,
        indicId: donnee[enTetes.indicId],
        zoneId: donnee[enTetes.zoneId],
        metricDate: donnee[enTetes.metricDate],
        metricType: donnee[enTetes.metricType],
        metricValue: `${donnee[enTetes.metricValue]}`,
      }));
    } else {
      listeErreursValidation = [ErreurValidationFichier.creerErreurValidationFichier({
        cellule: 'identifiant_indic',
        nom: 'identifiant_indic',
        message: "L'en-tête identifiant_indic n'est pas présente",
        numeroDeLigne: 0,
        positionDeLigne: 0,
        nomDuChamp: 'identifiant_indic',
        positionDuChamp: 0,
      })];
    }

    const listeErreursReport = report.tasks.flatMap(task => task.errors).map(taskError => ErreurValidationFichier.creerErreurValidationFichier({
      cellule: taskError.cell,
      nom: taskError.name,
      message: personnaliserValidataMessage(taskError),
      numeroDeLigne: taskError.rowNumber,
      positionDeLigne: taskError.rowPosition,
      nomDuChamp: taskError.fieldName || '',
      positionDuChamp: taskError.fieldPosition,
    }));

    listeErreursValidation = [...listeErreursValidation, ...listeErreursReport];

    rapport.affecterListeMesuresIndicateurTemporaire(listeIndicateursData);
    rapport.affecterListeErreursValidation(listeErreursValidation);

    return rapport;
  }
}
