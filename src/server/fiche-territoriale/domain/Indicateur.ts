export class Indicateur {
  private readonly _id: string;

  private readonly _nom: string;

  private readonly _dateValeurActuelle: string;

  private readonly _objectifTauxAvancement: number | null;

  private readonly _valeurActuelle: number | null;

  private readonly _valeurCible: number | null;

  private readonly _uniteMesure: string | null;

  private constructor({ id, nom, dateValeurActuelle, objectifTauxAvancement, valeurActuelle, valeurCible, uniteMesure }: {
    id: string,
    nom: string,
    dateValeurActuelle: string,
    objectifTauxAvancement: number | null,
    valeurActuelle: number | null,
    valeurCible: number | null,
    uniteMesure: string | null
  }) {
    this._id = id;
    this._nom = nom;
    this._dateValeurActuelle = dateValeurActuelle;
    this._objectifTauxAvancement = objectifTauxAvancement;
    this._valeurActuelle = valeurActuelle;
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

  get dateValeurActuelle(): string {
    return this._dateValeurActuelle;
  }

  get objectifTauxAvancement(): number | null {
    return this._objectifTauxAvancement;
  }

  get valeurActuelle(): number | null {
    return this._valeurActuelle;
  }

  get valeurCible(): number | null {
    return this._valeurCible;
  }

  get uniteMesure(): string | null {
    return this._uniteMesure;
  }

  static creerIndicateur({ id, nom, dateValeurActuelle, objectifTauxAvancement, valeurActuelle, valeurCible, uniteMesure }: {
    id: string,
    nom: string,
    dateValeurActuelle: string,
    objectifTauxAvancement: number | null,
    valeurActuelle: number | null,
    valeurCible: number | null,
    uniteMesure: string | null
  }) {
    return new Indicateur({ id, nom, dateValeurActuelle, objectifTauxAvancement, valeurActuelle, valeurCible, uniteMesure });
  }
}
