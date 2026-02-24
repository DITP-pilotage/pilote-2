export class IndicateurFicheConducteur {
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
    valeurAvancement,
    dateValeurAvancement,
    dateValeurInitiale,
    objectifValeurCibleIntermediaire,
    objectifTauxAvancementIntermediaire,
  }: {
    nom: string;
    type: string | null;
    valeurInitiale: number | null;
    valeurAvancement: number | null;
    dateValeurAvancement: string | null;
    dateValeurInitiale: string | null;
    objectifValeurCibleIntermediaire: number | null;
    objectifTauxAvancementIntermediaire: number | null;
  }) {
    this._nom = nom;
    this._type = type;
    this._valeurInitiale = valeurInitiale;
    this._valeurAvancement = valeurAvancement;
    this._dateValeurAvancement = dateValeurAvancement;
    this._dateValeurInitiale = dateValeurInitiale;
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

  get valeurAvancement(): number | null {
    return this._valeurAvancement;
  }

  get dateValeurAvancement(): string | null {
    return this._dateValeurAvancement;
  }

  get dateValeurInitiale(): string | null {
    return this._dateValeurInitiale;
  }

  get objectifValeurCibleIntermediaire(): number | null {
    return this._objectifValeurCibleIntermediaire;
  }

  get objectifTauxAvancementIntermediaire(): number | null {
    return this._objectifTauxAvancementIntermediaire;
  }

  static creerIndicateurFicheConducteur({
    nom,
    type,
    valeurInitiale,
    valeurAvancement,
    dateValeurAvancement,
    dateValeurInitiale,
    objectifValeurCibleIntermediaire,
    objectifTauxAvancementIntermediaire,
  }: {
    nom: string;
    type: string | null;
    valeurInitiale: number | null;
    valeurAvancement: number | null;
    dateValeurAvancement: string | null;
    dateValeurInitiale: string | null;
    objectifValeurCibleIntermediaire: number | null;
    objectifTauxAvancementIntermediaire: number | null;
  }) {
    return new IndicateurFicheConducteur({
      nom,
      type,
      valeurInitiale,
      valeurAvancement,
      dateValeurAvancement,
      dateValeurInitiale,
      objectifValeurCibleIntermediaire,
      objectifTauxAvancementIntermediaire,
    });
  }
}
