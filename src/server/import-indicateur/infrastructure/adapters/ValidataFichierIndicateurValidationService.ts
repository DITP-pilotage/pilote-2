import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import { FichierIndicateurValidationService } from '@/server/import-indicateur/domain/ports/FichierIndicateurValidationService';
import { HttpClient } from '@/server/import-indicateur/domain/ports/HttpClient';

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

  private constructor({ cellule, nom, message, numeroDeLigne, positionDeLigne, nomDuChamp, positionDuChamp }: { cellule: string, nom: string, message: string, numeroDeLigne: number, positionDeLigne: number, nomDuChamp: string, positionDuChamp: number }) {
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

  static creerErreurValidationFichier({ cellule, nom, message, numeroDeLigne, positionDeLigne, nomDuChamp, positionDuChamp }: { cellule: string, nom: string, message: string, numeroDeLigne: number, positionDeLigne: number, nomDuChamp: string, positionDuChamp: number }) {
    return new ErreurValidationFichier({ cellule, nom, message, numeroDeLigne, positionDeLigne, nomDuChamp, positionDuChamp });
  }
}

export class ValidataFichierIndicateurValidationService implements FichierIndicateurValidationService {
  private httpClient: HttpClient;

  constructor({ httpClient }: Dependencies) {
    this.httpClient = httpClient;
  }

  async validerFichier(formDataBody: FormData, contentType: string): Promise<DetailValidationFichier> {
    const report = await this.httpClient.post({ formDataBody, contentType });
  
    if (report.valid) {
      return DetailValidationFichier.creerDetailValidationFichier({ estValide: report.valid });
    }
    
    const listeErreursValidation = report.tasks.flatMap(task => task.errors).map(taskError => ErreurValidationFichier.creerErreurValidationFichier({
      cellule: taskError.cell,
      nom: taskError.name,
      message: taskError.message,
      numeroDeLigne: taskError.rowNumber,
      positionDeLigne: taskError.rowPosition,
      nomDuChamp: taskError.fieldName,
      positionDuChamp: taskError.fieldPosition,
    }));
  
    return DetailValidationFichier.creerDetailValidationFichier({ estValide: report.valid, listeErreursValidation });
  }
}
