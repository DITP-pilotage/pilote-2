export class IndicateurFicheConducteur {
  private readonly _nom: string;

  private readonly _type: string | null;

  private readonly _valeurInitiale: number | null;

  private readonly _dateValeurInitiale: string | null;

  private readonly _valeurActuelle: number | null;

  private readonly _dateValeurActuelle: string | null;

  private readonly _objectifValeurCibleIntermediaire: number | null;

  private readonly _objectifTauxAvancementIntermediaire: number | null;

  private readonly _objectifValeurCible: number | null;

  private readonly _objectifTauxAvancement: number | null;

  private constructor({
    nom,
    type,
    valeurInitiale,
    valeurActuelle,
    dateValeurActuelle,
    dateValeurInitiale,
    objectifValeurCibleIntermediaire,
    objectifTauxAvancementIntermediaire,
    objectifValeurCible,
    objectifTauxAvancement,
  }: {
    nom: string
    type: string | null
    valeurInitiale: number | null
    valeurActuelle: number | null
    dateValeurActuelle: string | null
    dateValeurInitiale: string | null
    objectifValeurCibleIntermediaire: number | null
    objectifTauxAvancementIntermediaire: number | null
    objectifValeurCible: number | null
    objectifTauxAvancement: number | null
  }) {
    this._nom = nom;
    this._type = type;
    this._valeurInitiale = valeurInitiale;
    this._valeurActuelle = valeurActuelle;
    this._dateValeurActuelle = dateValeurActuelle;
    this._dateValeurInitiale = dateValeurInitiale;
    this._objectifValeurCibleIntermediaire = objectifValeurCibleIntermediaire;
    this._objectifTauxAvancementIntermediaire = objectifTauxAvancementIntermediaire;
    this._objectifValeurCible = objectifValeurCible;
    this._objectifTauxAvancement = objectifTauxAvancement;
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

  get valeurActuelle(): number | null {
    return this._valeurActuelle;
  }

  get dateValeurActuelle(): string | null {
    return this._dateValeurActuelle;
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

  get objectifValeurCible(): number | null {
    return this._objectifValeurCible;
  }

  get objectifTauxAvancement(): number | null {
    return this._objectifTauxAvancement;
  }

  static creerIndicateurFicheConducteur({
    nom,
    type,
    valeurInitiale,
    valeurActuelle,
    dateValeurActuelle,
    dateValeurInitiale,
    objectifValeurCibleIntermediaire,
    objectifTauxAvancementIntermediaire,
    objectifValeurCible,
    objectifTauxAvancement,
  }: {
    nom: string
    type: string | null
    valeurInitiale: number | null
    valeurActuelle: number | null
    dateValeurActuelle: string | null
    dateValeurInitiale: string | null
    objectifValeurCibleIntermediaire: number | null
    objectifTauxAvancementIntermediaire: number | null
    objectifValeurCible: number | null
    objectifTauxAvancement: number | null
  }) {
    return new IndicateurFicheConducteur({
      nom,
      type,
      valeurInitiale,
      valeurActuelle,
      dateValeurActuelle,
      dateValeurInitiale,
      objectifValeurCibleIntermediaire,
      objectifTauxAvancementIntermediaire,
      objectifValeurCible,
      objectifTauxAvancement,
    });
  }
}
