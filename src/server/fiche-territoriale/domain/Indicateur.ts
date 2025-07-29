export class Indicateur {
  private readonly _id: string;

  private readonly _nom: string;

  private readonly _dateValeurAvancement: string;

  private readonly _objectifTauxAvancement: number | null;

  private readonly _valeurAvancement: number | null;

  private readonly _valeurCible: number | null;

  private readonly _uniteMesure: string | null;

  private constructor({
    id,
    nom,
    dateValeurAvancement,
    objectifTauxAvancement,
    valeurAvancement,
    valeurCible,
    uniteMesure,
  }: {
    id: string;
    nom: string;
    dateValeurAvancement: string;
    objectifTauxAvancement: number | null;
    valeurAvancement: number | null;
    valeurCible: number | null;
    uniteMesure: string | null;
  }) {
    this._id = id;
    this._nom = nom;
    this._dateValeurAvancement = dateValeurAvancement;
    this._objectifTauxAvancement = objectifTauxAvancement;
    this._valeurAvancement = valeurAvancement;
    this._valeurCible = valeurCible;
    this._uniteMesure = uniteMesure;
    this._objectifTauxAvancement = objectifTauxAvancement;
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

  get objectifTauxAvancement(): number | null {
    return this._objectifTauxAvancement;
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
    objectifTauxAvancement,
    valeurAvancement,
    valeurCible,
    uniteMesure,
  }: {
    id: string;
    nom: string;
    dateValeurAvancement: string;
    objectifTauxAvancement: number | null;
    valeurAvancement: number | null;
    valeurCible: number | null;
    uniteMesure: string | null;
  }) {
    return new Indicateur({
      id,
      nom,
      dateValeurAvancement,
      objectifTauxAvancement,
      valeurAvancement,
      valeurCible,
      uniteMesure,
    });
  }
}
