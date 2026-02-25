export class Indicateur {
  private readonly _nom: string;

  private readonly _type: string | null;

  private readonly _valeurInitiale: number | null;

  private readonly _dateValeurInitiale: string | null;

  private readonly _valeurAvancement: number | null;

  private readonly _dateValeurAvancement: string | null;

  private readonly _valeurCible: number | null;

  private readonly _tauxAvancement: number | null;

  private constructor({
    nom,
    type,
    valeurInitiale,
    dateValeurInitiale,
    valeurAvancement,
    dateValeurAvancement,
    valeurCible,
    tauxAvancement,
  }: {
    nom: string;
    type: string | null;
    valeurInitiale: number | null;
    dateValeurInitiale: string | null;
    valeurAvancement: number | null;
    dateValeurAvancement: string | null;
    valeurCible: number | null;
    tauxAvancement: number | null;
  }) {
    this._nom = nom;
    this._type = type;
    this._valeurInitiale = valeurInitiale;
    this._dateValeurInitiale = dateValeurInitiale;
    this._valeurAvancement = valeurAvancement;
    this._dateValeurAvancement = dateValeurAvancement;
    this._valeurCible = valeurCible;
    this._tauxAvancement = tauxAvancement;
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

  get valeurCible(): number | null {
    return this._valeurCible;
  }

  get tauxAvancement(): number | null {
    return this._tauxAvancement;
  }

  static creerIndicateur({
    nom,
    type,
    valeurInitiale,
    dateValeurInitiale,
    valeurAvancement,
    dateValeurAvancement,
    valeurCible,
    tauxAvancement,
  }: {
    nom: string;
    type: string | null;
    valeurInitiale: number | null;
    dateValeurInitiale: string | null;
    valeurAvancement: number | null;
    dateValeurAvancement: string | null;
    valeurCible: number | null;
    tauxAvancement: number | null;
  }) {
    return new Indicateur({
      nom,
      type,
      valeurInitiale,
      dateValeurInitiale,
      valeurAvancement,
      dateValeurAvancement,
      valeurCible,
      tauxAvancement,
    });
  }
}
