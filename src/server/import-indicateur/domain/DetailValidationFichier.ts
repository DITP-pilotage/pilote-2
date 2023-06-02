import { randomUUID } from 'node:crypto';
import { MesureIndicateurTemporaire } from '@/server/import-indicateur/domain/MesureIndicateurTemporaire';
import { ErreurValidationFichier } from '@/server/import-indicateur/domain/ErreurValidationFichier';

export class DetailValidationFichier {
  private readonly _id: string;

  private readonly _estValide: boolean;

  private readonly _listeErreursValidation: ErreurValidationFichier[];
  
  private readonly _listeMesuresIndicateurTemporaire: MesureIndicateurTemporaire[];

  private readonly _utilisateurEmail: string;

  private readonly _dateCreation: Date;

  private constructor({
    id,
    estValide,
    dateCreation,
    utilisateurEmail,
    listeErreursValidation,
    listeMesuresIndicateurTemporaire,
  }: { id: string, estValide: boolean, dateCreation: Date, utilisateurEmail: string,  listeErreursValidation: ErreurValidationFichier[], listeMesuresIndicateurTemporaire: MesureIndicateurTemporaire[] }) {
    this._id = id;
    this._estValide = estValide;
    this._dateCreation = dateCreation;
    this._utilisateurEmail = utilisateurEmail;
    this._listeErreursValidation = listeErreursValidation;
    this._listeMesuresIndicateurTemporaire = listeMesuresIndicateurTemporaire;
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

  static creerDetailValidationFichier({
    id,
    estValide,
    dateCreation,
    utilisateurEmail,
    listeErreursValidation = [],
    listeMesuresIndicateurTemporaire = [],
  }: { id?: string, estValide: boolean, dateCreation?: Date, utilisateurEmail: string, listeErreursValidation?: ErreurValidationFichier[], listeMesuresIndicateurTemporaire?: MesureIndicateurTemporaire[] }) {
    return new DetailValidationFichier({ id: id || randomUUID(), dateCreation: dateCreation || new Date(), utilisateurEmail, estValide, listeErreursValidation, listeMesuresIndicateurTemporaire });
  }

  affecterListeMesuresIndicateurTemporaire(listeMesuresIndicateurTemporaire: MesureIndicateurTemporaire[]) {
    this._listeMesuresIndicateurTemporaire.push(...listeMesuresIndicateurTemporaire);
  }

  affecterListeErreursValidation(listeErreursValidation: ErreurValidationFichier[]) {
    this._listeErreursValidation.push(...listeErreursValidation);
  }
}
