import { ErreurValidationFichier } from '@/server/import-indicateur/infrastructure/adapters/ValidataFichierIndicateurValidationService';
import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';

export class DetailValidationFichier {
  private readonly _estValide: boolean;

  private readonly _listeErreursValidation: ErreurValidationFichier[];

  private readonly _listeIndicateursData: IndicateurData[];

  private constructor({
    estValide,
    listeErreursValidation,
    listeIndicateursData,
  }: { estValide: boolean, listeErreursValidation: ErreurValidationFichier[], listeIndicateursData: IndicateurData[] }) {
    this._estValide = estValide;
    this._listeErreursValidation = listeErreursValidation;
    this._listeIndicateursData = listeIndicateursData;
  }

  get estValide(): boolean {
    return this._estValide;
  }

  get listeErreursValidation(): ErreurValidationFichier[] {
    return this._listeErreursValidation;
  }

  get listeIndicateursData(): IndicateurData[] {
    return this._listeIndicateursData;
  }

  static creerDetailValidationFichier({
    estValide,
    listeErreursValidation = [],
    listeIndicateursData = [],
  }: { estValide: boolean, listeErreursValidation?: ErreurValidationFichier[], listeIndicateursData?: IndicateurData[] }) {
    return new DetailValidationFichier({ estValide, listeErreursValidation, listeIndicateursData });
  }
}
