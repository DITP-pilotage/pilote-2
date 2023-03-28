import { ErreurValidationFichier } from '@/server/import-indicateur/infrastructure/adapters/ValidataFichierIndicateurValidationService';

export class DetailValidationFichier {
  private readonly _estValide: boolean;

  private readonly _listeErreursValidation: ErreurValidationFichier[];

  private constructor({ estValide, listeErreursValidation }: { estValide: boolean, listeErreursValidation: ErreurValidationFichier[] }) {
    this._estValide = estValide;
    this._listeErreursValidation = listeErreursValidation;
  }

  get estValide(): boolean {
    return this._estValide;
  }

  get listeErreursValidation(): ErreurValidationFichier[] {
    return this._listeErreursValidation;
  }

  static creerDetailValidationFichier({ estValide, listeErreursValidation = [] }: { estValide: boolean, listeErreursValidation?: ErreurValidationFichier[] }) {
    return new DetailValidationFichier({ estValide, listeErreursValidation });
  }
}
