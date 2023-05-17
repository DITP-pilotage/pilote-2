import { randomUUID } from 'node:crypto';
import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';
import { ErreurValidationFichier } from '@/server/import-indicateur/domain/ErreurValidationFichier';

export class DetailValidationFichier {
  private readonly _id: string;

  private readonly _estValide: boolean;

  private readonly _listeErreursValidation: ErreurValidationFichier[];
  
  private readonly _listeIndicateursData: IndicateurData[];

  private readonly _utilisateurEmail: string;

  private readonly _dateCreation: Date;

  private constructor({
    id,
    estValide,
    dateCreation,
    utilisateurEmail,
    listeErreursValidation,
    listeIndicateursData,
  }: { id: string, estValide: boolean, dateCreation: Date, utilisateurEmail: string,  listeErreursValidation: ErreurValidationFichier[], listeIndicateursData: IndicateurData[] }) {
    this._id = id;
    this._estValide = estValide;
    this._dateCreation = dateCreation;
    this._utilisateurEmail = utilisateurEmail;
    this._listeErreursValidation = listeErreursValidation;
    this._listeIndicateursData = listeIndicateursData;
  }

  get id(): string {
    return this._id;
  }

  get utilisateurEmail(): string {
    return this._utilisateurEmail;
  }

  get dateCreation(): Date {
    return this._dateCreation;
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
    id,
    estValide,
    dateCreation,
    utilisateurEmail,
    listeErreursValidation = [],
    listeIndicateursData = [],
  }: { id?: string, estValide: boolean, dateCreation?: Date, utilisateurEmail: string, listeErreursValidation?: ErreurValidationFichier[], listeIndicateursData?: IndicateurData[] }) {
    return new DetailValidationFichier({ id: id || randomUUID(), dateCreation: dateCreation || new Date(), utilisateurEmail, estValide, listeErreursValidation, listeIndicateursData });
  }

  affecterListeIndicateursData(listeIndicateursData: IndicateurData[]) {
    this._listeIndicateursData.push(...listeIndicateursData);
  }

  affecterListeErreursValidation(listeErreursValidation: ErreurValidationFichier[]) {
    this._listeErreursValidation.push(...listeErreursValidation);
  }
}
