import { randomUUID } from 'node:crypto';
import { MesureIndicateurTemporaire } from '@/server/import-indicateur/domain/MesureIndicateurTemporaire';
import { ErreurValidationFichier } from '@/server/import-indicateur/domain/ErreurValidationFichier';
import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';

export class DetailValidationFichier {
  private readonly _id: string;

  private readonly _estValide: boolean;

  private readonly _listeErreursValidation: ErreurValidationFichier[];

  private readonly _listeMesuresIndicateurTemporaire: MesureIndicateurTemporaire[];

  private readonly _listeIndicateursData: IndicateurData[];

  private readonly _utilisateurEmail: string;

  private readonly _dateCreation: Date;

  private constructor({
    id,
    estValide,
    dateCreation,
    utilisateurEmail,
    listeErreursValidation,
    listeMesuresIndicateurTemporaire,
    listeIndicateursData,
  }: {
    id: string,
    estValide: boolean,
    dateCreation: Date,
    utilisateurEmail: string,
    listeErreursValidation: ErreurValidationFichier[],
    listeMesuresIndicateurTemporaire: MesureIndicateurTemporaire[],
    listeIndicateursData: IndicateurData[]
  }) {
    this._id = id;
    this._estValide = estValide;
    this._dateCreation = dateCreation;
    this._utilisateurEmail = utilisateurEmail;
    this._listeErreursValidation = listeErreursValidation;
    this._listeMesuresIndicateurTemporaire = listeMesuresIndicateurTemporaire;
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

  get listeMesuresIndicateurTemporaire(): MesureIndicateurTemporaire[] {
    return this._listeMesuresIndicateurTemporaire;
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
    listeMesuresIndicateurTemporaire = [],
    listeIndicateursData = [],
  }: {
    id?: string,
    estValide: boolean,
    dateCreation?: Date,
    utilisateurEmail: string,
    listeErreursValidation?: ErreurValidationFichier[],
    listeMesuresIndicateurTemporaire?: MesureIndicateurTemporaire[]
    listeIndicateursData?: IndicateurData[]
  }) {
    return new DetailValidationFichier({
      id: id || randomUUID(),
      dateCreation: dateCreation || new Date(),
      utilisateurEmail,
      estValide,
      listeErreursValidation,
      listeMesuresIndicateurTemporaire,
      listeIndicateursData,
    });
  }

  affecterListeMesuresIndicateurTemporaire(listeMesuresIndicateurTemporaire: MesureIndicateurTemporaire[]) {
    this._listeMesuresIndicateurTemporaire.push(...listeMesuresIndicateurTemporaire);
  }

  affecterListeErreursValidation(listeErreursValidation: ErreurValidationFichier[]) {
    this._listeErreursValidation.push(...listeErreursValidation);
  }
}
