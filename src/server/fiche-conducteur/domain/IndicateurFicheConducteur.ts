export class IndicateurFicheConducteur {
  private readonly _nom: string;

  private readonly _valeurInitiale: number | null;

  private readonly _valeurActuelle: number | null;

  private readonly _dateValeurActuelle: string | null;

  private readonly _objectifValeurCibleIntermediaire: number | null;

  private readonly _objectifTauxAvancementIntermediaire: number | null;

  private readonly _objectifValeurCible: number | null;

  private readonly _objectifTauxAvancement: number | null;

  private constructor({
    nom,
    valeurInitiale,
    valeurActuelle,
    dateValeurActuelle,
    objectifValeurCibleIntermediaire,
    objectifTauxAvancementIntermediaire,
    objectifValeurCible,
    objectifTauxAvancement,
  }: {
    nom: string
    valeurInitiale: number | null
    valeurActuelle: number | null
    dateValeurActuelle: string | null
    objectifValeurCibleIntermediaire: number | null
    objectifTauxAvancementIntermediaire: number | null
    objectifValeurCible: number | null
    objectifTauxAvancement: number | null
  }) {
    this._nom = nom;
    this._valeurInitiale = valeurInitiale;
    this._valeurActuelle = valeurActuelle;
    this._dateValeurActuelle = dateValeurActuelle;
    this._objectifValeurCibleIntermediaire = objectifValeurCibleIntermediaire;
    this._objectifTauxAvancementIntermediaire = objectifTauxAvancementIntermediaire;
    this._objectifValeurCible = objectifValeurCible;
    this._objectifTauxAvancement = objectifTauxAvancement;
  }

  get nom(): string {
    return this._nom;
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
    valeurInitiale,
    valeurActuelle,
    dateValeurActuelle,
    objectifValeurCibleIntermediaire,
    objectifTauxAvancementIntermediaire,
    objectifValeurCible,
    objectifTauxAvancement,
  }: {
    nom: string
    valeurInitiale: number | null
    valeurActuelle: number | null
    dateValeurActuelle: string | null
    objectifValeurCibleIntermediaire: number | null
    objectifTauxAvancementIntermediaire: number | null
    objectifValeurCible: number | null
    objectifTauxAvancement: number | null
  }) {
    return new IndicateurFicheConducteur({
      nom,
      valeurInitiale,
      valeurActuelle,
      dateValeurActuelle,
      objectifValeurCibleIntermediaire,
      objectifTauxAvancementIntermediaire,
      objectifValeurCible,
      objectifTauxAvancement,
    });
  }
}
