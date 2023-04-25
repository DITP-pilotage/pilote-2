import {
  FichierIndicateurValidationService,
  ValiderFichierPayload,
} from '@/server/domain/fichier/FichierIndicateurValidationService.interface';
import { HttpClient } from '@/server/import-indicateur/domain/ports/HttpClient';
import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';
import {
  ReportErrorTask,
  ReportResourceTaskData,
  ReportTask,
} from '@/server/import-indicateur/infrastructure/ReportValidata.interface';
import { DetailValidationFichier } from '@/server/domain/fichier/DetailValidationFichier';

interface Dependencies {
  httpClient: HttpClient
}

export class ErreurValidationFichier {
  private readonly _cellule: string;

  private readonly _nom: string;

  private readonly _message: string;

  private readonly _numeroDeLigne: number;

  private readonly _positionDeLigne: number;

  private readonly _nomDuChamp: string;

  private readonly _positionDuChamp: number;

  private constructor({ cellule, nom, message, numeroDeLigne, positionDeLigne, nomDuChamp, positionDuChamp }: {
    cellule: string,
    nom: string,
    message: string,
    numeroDeLigne: number,
    positionDeLigne: number,
    nomDuChamp: string,
    positionDuChamp: number
  }) {
    this._cellule = cellule;
    this._nom = nom;
    this._message = message;
    this._numeroDeLigne = numeroDeLigne;
    this._positionDeLigne = positionDeLigne;
    this._nomDuChamp = nomDuChamp;
    this._positionDuChamp = positionDuChamp;
  }

  get cellule() {
    return this._cellule;
  }

  get nom() {
    return this._nom;
  }

  get message() {
    return this._message;
  }

  get numeroDeLigne() {
    return this._numeroDeLigne;
  }

  get positionDeLigne() {
    return this._positionDeLigne;
  }

  get nomDuChamp() {
    return this._nomDuChamp;
  }

  get positionDuChamp() {
    return this._positionDuChamp;
  }

  static creerErreurValidationFichier({
    cellule,
    nom,
    message,
    numeroDeLigne,
    positionDeLigne,
    nomDuChamp,
    positionDuChamp,
  }: {
    cellule: string,
    nom: string,
    message: string,
    numeroDeLigne: number,
    positionDeLigne: number,
    nomDuChamp: string,
    positionDuChamp: number
  }) {
    return new ErreurValidationFichier({
      cellule,
      nom,
      message,
      numeroDeLigne,
      positionDeLigne,
      nomDuChamp,
      positionDuChamp,
    });
  }
}

const extraireLesDonnees = (task: ReportTask): string[][] => {
  const [, ...data] = task.resource.data;
  return data;
};

enum EnTeteFichierEnum {
  INDIC_ID = 'indic_id',
  ZONE_ID = 'zone_id',
  METRIC_DATE = 'metric_date',
  METRIC_TYPE = 'metric_type',
  METRIC_VALUE = 'metric_value',
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

const initialiserMapFieldNameErreurDITP: (taskError: ReportErrorTask) => Record<string, Record<string, string>> =  (taskError) => ({
  'indic_id': {
    'constraint \"required\" is \"True\"': `Un indicateur ne peut etre vide. C'est le cas à la ligne ${taskError.rowPosition}.`,
    'constraint \"pattern\" is \"^IND-[0-9]{3}$\"': "L'identifiant de l'indicateur doit être renseigné dans le format IND-XXX. Vous pouvez vous référer au guide des indicateurs pour trouver l'identifiant de votre indicateur.",
  },
  'metric_type': {
    "constraint \"enum\" is \"['vi', 'va', 'vc']\"": 'Le type de valeur doit être vi (valeur initiale), va (valeur actuelle) ou vc (valeur cible).',
    "constraint \"enum\" is \"['va']\"": 'Le type de valeur doit être va (valeur actuelle). Vous ne pouvez saisir que des valeurs actuelles.',
  },
  'zone_id': {
    'constraint "pattern" is "^(R[0-9]{2,3})$"': `Veuillez entrer uniquement une zone régionale dans la colonne zone_id. '${taskError.cell}' n'est pas une zone régionale.`,
  },
});
const initialiserMapCodeErreurDITP: (taskError: ReportErrorTask) => Record<string, Record<string, string>> =  (taskError) => {
  const cléPourCode = `the same as in the row at position ${taskError.rowPosition}`;
  const mapCodeNote: Record<string, string>  = {};
  mapCodeNote[cléPourCode] = `La ligne ${taskError.rowPosition} comporte la même zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez en supprimer une des deux.`;
  return {
    'primary-key-error': mapCodeNote,
  };
};
const personnaliserValidataMessage = (taskError: ReportErrorTask): string => {
  const fieldName = taskError.fieldName || 'unknown';
  const { note, code, message } = taskError;

  const mapFieldNameErreurDITP = initialiserMapFieldNameErreurDITP(taskError);
  if (mapFieldNameErreurDITP[fieldName] && mapFieldNameErreurDITP[fieldName][note]) {
    return mapFieldNameErreurDITP[fieldName][note];
  }
  const mapCodeErreurDITP = initialiserMapCodeErreurDITP(taskError);
  if (mapCodeErreurDITP[code] && mapCodeErreurDITP[code][note]) {
    return mapCodeErreurDITP[code][note];
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
  }: ValiderFichierPayload): Promise<DetailValidationFichier> {
    const report = await this.httpClient.post({ cheminCompletDuFichier, nomDuFichier, schema });

    const { enTetes, donnees } = extraireLeContenuDuFichier(report.tasks);

    let listeIndicateursData: IndicateurData[] = [];
    if (report.tasks[0].resource) {
      listeIndicateursData = donnees.flat().map(donnee => IndicateurData.createIndicateurData({
        indicId: donnee[enTetes.indicId],
        zoneId: donnee[enTetes.zoneId],
        metricDate: donnee[enTetes.metricDate],
        metricType: donnee[enTetes.metricType],
        metricValue: `${donnee[enTetes.metricValue]}`,
      }));
    }

    if (report.valid) {
      return DetailValidationFichier.creerDetailValidationFichier({ estValide: report.valid, listeIndicateursData });
    }

    const listeErreursValidation = report.tasks.flatMap(task => task.errors).map(taskError => ErreurValidationFichier.creerErreurValidationFichier({
      cellule: taskError.cell,
      nom: taskError.name,
      message: personnaliserValidataMessage(taskError),
      numeroDeLigne: taskError.rowNumber,
      positionDeLigne: taskError.rowPosition,
      nomDuChamp: taskError.fieldName || '',
      positionDuChamp: taskError.fieldPosition,
    }));

    return DetailValidationFichier.creerDetailValidationFichier({
      estValide: report.valid,
      listeErreursValidation,
      listeIndicateursData,
    });
  }
}
