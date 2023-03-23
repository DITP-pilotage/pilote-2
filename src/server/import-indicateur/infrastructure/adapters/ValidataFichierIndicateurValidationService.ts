import {
  FichierIndicateurValidationService,
} from '@/server/import-indicateur/domain/ports/fichier-indicateur-validation.service';
import { HttpClient } from '@/server/import-indicateur/domain/ports/HttpClient';
import { DetailValidationFichier } from '@/server/import-indicateur/domain/detail-validation.fichier';

interface Dependencies {
  httpClient: HttpClient
}

export class ErreurValidationFichier {
  private readonly _cellule: string;

  private constructor({ cellule }: { cellule: string }) {
    this._cellule = cellule;
  }

  get cellule() {
    return this._cellule;
  }

  static creerErreurValidationFichier({ cellule }: { cellule: string }) {
    return new ErreurValidationFichier({ cellule });
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
    
    const listeErreursValidation = report.tasks.flatMap(task => task.errors).map(taskError => ErreurValidationFichier.creerErreurValidationFichier({ cellule: taskError.cell }));
  
    return DetailValidationFichier.creerDetailValidationFichier({ estValide: report.valid, listeErreursValidation });
  }
}
