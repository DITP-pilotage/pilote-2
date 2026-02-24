export class Indicateur {
  private readonly _nom: string;

  private readonly _type: string | null;

  private readonly _valeurInitiale: number | null;

  private readonly _dateValeurInitiale: string | null;

  private readonly _valeurAvancement: number | null;

  private readonly _dateValeurAvancement: string | null;

  private readonly _objectifValeurCibleIntermediaire: number | null;

  private readonly _objectifTauxAvancementIntermediaire: number | null;

  private constructor({
    nom,
    type,
    valeurInitiale,
    dateValeurInitiale,
    valeurAvancement,
    dateValeurAvancement,
    objectifValeurCibleIntermediaire,
    objectifTauxAvancementIntermediaire,
  }: {
    nom: string;
    type: string | null;
    valeurInitiale: number | null;
    dateValeurInitiale: string | null;
    valeurAvancement: number | null;
    dateValeurAvancement: string | null;
    objectifValeurCibleIntermediaire: number | null;
    objectifTauxAvancementIntermediaire: number | null;
  }) {
    this._nom = nom;
    this._type = type;
    this._valeurInitiale = valeurInitiale;
    this._dateValeurInitiale = dateValeurInitiale;
    this._valeurAvancement = valeurAvancement;
    this._dateValeurAvancement = dateValeurAvancement;
    this._objectifValeurCibleIntermediaire = objectifValeurCibleIntermediaire;
    this._objectifTauxAvancementIntermediaire =
      objectifTauxAvancementIntermediaire;
  }

  get nom(): string {
    return this._nom;
  }

  get type(): string | null {
    return this._type;
  }

  get valeurInitiale(): number | null {
    return this._valeurInitiale;
  }

  get dateValeurInitiale(): string | null {
    return this._dateValeurInitiale;
  }

  get valeurAvancement(): number | null {
    return this._valeurAvancement;
  }

  get dateValeurAvancement(): string | null {
    return this._dateValeurAvancement;
  }

  get objectifValeurCibleIntermediaire(): number | null {
    return this._objectifValeurCibleIntermediaire;
  }

  get objectifTauxAvancementIntermediaire(): number | null {
    return this._objectifTauxAvancementIntermediaire;
  }

  static creerIndicateur({
    nom,
    type,
    valeurInitiale,
    dateValeurInitiale,
    valeurAvancement,
    dateValeurAvancement,
    objectifValeurCibleIntermediaire,
    objectifTauxAvancementIntermediaire,
  }: {
    nom: string;
    type: string | null;
    valeurInitiale: number | null;
    dateValeurInitiale: string | null;
    valeurAvancement: number | null;
    dateValeurAvancement: string | null;
    objectifValeurCibleIntermediaire: number | null;
    objectifTauxAvancementIntermediaire: number | null;
  }) {
    return new Indicateur({
      nom,
      type,
      valeurInitiale,
      dateValeurInitiale,
      valeurAvancement,
      dateValeurAvancement,
      objectifValeurCibleIntermediaire,
      objectifTauxAvancementIntermediaire,
    });
  }
}
