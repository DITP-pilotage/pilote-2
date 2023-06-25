import { randomUUID } from 'node:crypto';

export class ErreurValidationFichier {
  private readonly _id: string;

  private readonly _rapportId: string;

  private readonly _cellule: string;

  private readonly _nom: string;

  private readonly _message: string;

  private readonly _numeroDeLigne: number;

  private readonly _positionDeLigne: number;

  private readonly _nomDuChamp: string;

  private readonly _positionDuChamp: number;

  private constructor({
    id,
    rapportId,
    cellule,
    nom,
    message,
    numeroDeLigne,
    positionDeLigne,
    nomDuChamp,
    positionDuChamp,
  }: {
    id: string,
    rapportId: string,
    cellule: string,
    nom: string,
    message: string,
    numeroDeLigne: number,
    positionDeLigne: number,
    nomDuChamp: string,
    positionDuChamp: number
  }) {
    this._id = id;
    this._rapportId = rapportId;
    this._cellule = cellule;
    this._nom = nom;
    this._message = message;
    this._numeroDeLigne = numeroDeLigne;
    this._positionDeLigne = positionDeLigne;
    this._nomDuChamp = nomDuChamp;
    this._positionDuChamp = positionDuChamp;
  }

  get id(): string {
    return this._id;
  }

  get rapportId(): string {
    return this._rapportId;
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
    id,
    rapportId,
    cellule,
    nom,
    message,
    numeroDeLigne,
    positionDeLigne,
    nomDuChamp,
    positionDuChamp,
  }: {
    id?: string,
    rapportId: string,
    cellule: string,
    nom: string,
    message: string,
    numeroDeLigne: number,
    positionDeLigne: number,
    nomDuChamp: string,
    positionDuChamp: number
  }) {
    return new ErreurValidationFichier({
      id: id || randomUUID(),
      rapportId,
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
