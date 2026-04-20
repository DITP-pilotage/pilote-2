export class Indicateur {
  private readonly _id: string;

  private readonly _nom: string;

  private readonly _dateValeurAvancement: string;

  private readonly _tauxAvancement: number | null;

  private readonly _valeurAvancement: number | null;

  private readonly _valeurCible: number | null;

  private readonly _uniteMesure: string | null;

  private constructor({
    id,
    nom,
    dateValeurAvancement,
    tauxAvancement,
    valeurAvancement,
    valeurCible,
    uniteMesure,
  }: {
    id: string;
    nom: string;
    dateValeurAvancement: string;
    tauxAvancement: number | null;
    valeurAvancement: number | null;
    valeurCible: number | null;
    uniteMesure: string | null;
  }) {
    this._id = id;
    this._nom = nom;
    this._dateValeurAvancement = dateValeurAvancement;
    this._valeurAvancement = valeurAvancement;
    this._valeurCible = valeurCible;
    this._uniteMesure = uniteMesure;
    this._tauxAvancement = tauxAvancement;
  }

  get id(): string {
    return this._id;
  }

  get nom(): string {
    return this._nom;
  }

  get dateValeurAvancement(): string {
    return this._dateValeurAvancement;
  }

  get tauxAvancement(): number | null {
    return this._tauxAvancement;
  }

  get valeurAvancement(): number | null {
    return this._valeurAvancement;
  }

  get valeurCible(): number | null {
    return this._valeurCible;
  }

  get uniteMesure(): string | null {
    return this._uniteMesure;
  }

  static creerIndicateur({
    id,
    nom,
    dateValeurAvancement,
    tauxAvancement,
    valeurAvancement,
    valeurCible,
    uniteMesure,
  }: {
    id: string;
    nom: string;
    dateValeurAvancement: string;
    tauxAvancement: number | null;
    valeurAvancement: number | null;
    valeurCible: number | null;
    uniteMesure: string | null;
  }) {
    return new Indicateur({
      id,
      nom,
      dateValeurAvancement,
      tauxAvancement,
      valeurAvancement,
      valeurCible,
      uniteMesure,
    });
  }
}
