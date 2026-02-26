export class DonneeIndicateur {
  private readonly _indicId: string;

  private readonly _zoneId: string;

  private readonly _maille: string;

  private readonly _codeInsee: string;

  private readonly _territoireCode: string;

  private readonly _valeurInitiale: number | null;

  private readonly _dateValeurInitiale: Date | null;

  private readonly _valeurAvancement: number | null;

  private readonly _dateValeurAvancement: Date | null;

  private readonly _valeurCible: number | null;

  private readonly _dateValeurCible: Date | null;

  private readonly _tauxAvancement: number | null;

  private readonly _estBarometre: boolean;

  private constructor({
    indicId,
    zoneId,
    maille,
    codeInsee,
    territoireCode,
    valeurInitiale,
    dateValeurInitiale,
    valeurAvancement,
    dateValeurAvancement,
    valeurCible,
    dateValeurCible,
    tauxAvancement,
    estBarometre,
  }: {
    indicId: string;
    zoneId: string;
    maille: string;
    codeInsee: string;
    territoireCode: string;
    valeurInitiale: number | null;
    dateValeurInitiale: Date | null;
    valeurAvancement: number | null;
    dateValeurAvancement: Date | null;
    valeurCible: number | null;
    dateValeurCible: Date | null;
    tauxAvancement: number | null;
    estBarometre: boolean;
  }) {
    this._indicId = indicId;
    this._zoneId = zoneId;
    this._maille = maille;
    this._codeInsee = codeInsee;
    this._territoireCode = territoireCode;
    this._valeurInitiale = valeurInitiale;
    this._dateValeurInitiale = dateValeurInitiale;
    this._valeurAvancement = valeurAvancement;
    this._dateValeurAvancement = dateValeurAvancement;
    this._valeurCible = valeurCible;
    this._dateValeurCible = dateValeurCible;
    this._tauxAvancement = tauxAvancement;
    this._estBarometre = estBarometre;
  }

  get indicId(): string {
    return this._indicId;
  }

  get zoneId(): string {
    return this._zoneId;
  }

  get maille(): string {
    return this._maille;
  }

  get codeInsee(): string {
    return this._codeInsee;
  }

  get territoireCode(): string {
    return this._territoireCode;
  }

  get valeurInitiale(): number | null {
    return this._valeurInitiale;
  }

  get dateValeurInitiale(): Date | null {
    return this._dateValeurInitiale;
  }

  get valeurAvancement(): number | null {
    return this._valeurAvancement;
  }

  get dateValeurAvancement(): Date | null {
    return this._dateValeurAvancement;
  }

  get valeurCible(): number | null {
    return this._valeurCible;
  }

  get dateValeurCible(): Date | null {
    return this._dateValeurCible;
  }

  get tauxAvancement(): number | null {
    return this._tauxAvancement;
  }

  get estBarometre(): boolean {
    return this._estBarometre;
  }

  static creerDonneeIndicateur({
    indicId,
    zoneId,
    maille,
    codeInsee,
    territoireCode,
    valeurInitiale,
    dateValeurInitiale,
    valeurAvancement,
    dateValeurAvancement,
    valeurCible,
    dateValeurCible,
    tauxAvancement,
    estBarometre,
  }: {
    indicId: string;
    zoneId: string;
    maille: string;
    codeInsee: string;
    territoireCode: string;
    valeurInitiale: number | null;
    dateValeurInitiale: Date | null;
    valeurAvancement: number | null;
    dateValeurAvancement: Date | null;
    valeurCible: number | null;
    dateValeurCible: Date | null;
    tauxAvancement: number | null;
    estBarometre: boolean;
  }) {
    return new DonneeIndicateur({
      indicId,
      zoneId,
      maille,
      codeInsee,
      territoireCode,
      valeurInitiale,
      dateValeurInitiale,
      valeurAvancement,
      dateValeurAvancement,
      valeurCible,
      dateValeurCible,
      tauxAvancement,
      estBarometre,
    });
  }
}
