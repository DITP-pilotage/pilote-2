export class DonneeIndicateur {
  private readonly _indicId: string;

  private readonly _zoneId: string;

  private readonly _maille: string;

  private readonly _codeInsee: string;

  private readonly _territoireCode: string;

  private readonly _valeurInitiale: number | null;

  private readonly _dateValeurInitiale: Date | null;

  private readonly _valeurActuelle: number | null;

  private readonly _dateValeurActuelle: Date | null;

  private readonly _valeurCibleAnnuelle: number | null;

  private readonly _dateValeurCibleAnnuelle: Date | null;

  private readonly _tauxAvancementAnnuel: number | null;

  private readonly _valeurCibleGlobale: number | null;

  private readonly _dateValeurCibleGlobale: Date | null;

  private readonly _tauxAvancementGlobale: number | null;

  private readonly _estBarometre: boolean;

  private constructor({
    indicId,
    zoneId,
    maille,
    codeInsee,
    territoireCode,
    valeurInitiale,
    dateValeurInitiale,
    valeurActuelle,
    dateValeurActuelle,
    valeurCibleAnnuelle,
    dateValeurCibleAnnuelle,
    tauxAvancementAnnuel,
    valeurCibleGlobale,
    dateValeurCibleGlobale,
    tauxAvancementGlobale,
    estBarometre,
  }: {
    indicId: string,
    zoneId: string,
    maille: string,
    codeInsee: string,
    territoireCode: string,
    valeurInitiale: number | null,
    dateValeurInitiale: Date | null,
    valeurActuelle: number | null,
    dateValeurActuelle: Date | null,
    valeurCibleAnnuelle: number | null,
    dateValeurCibleAnnuelle: Date | null,
    tauxAvancementAnnuel: number | null,
    valeurCibleGlobale: number | null,
    dateValeurCibleGlobale: Date | null,
    tauxAvancementGlobale: number | null,
    estBarometre: boolean,
  }) {
    this._indicId = indicId;
    this._zoneId = zoneId;
    this._maille = maille;
    this._codeInsee = codeInsee;
    this._territoireCode = territoireCode;
    this._valeurInitiale = valeurInitiale;
    this._dateValeurInitiale = dateValeurInitiale;
    this._valeurActuelle = valeurActuelle;
    this._dateValeurActuelle = dateValeurActuelle;
    this._valeurCibleAnnuelle = valeurCibleAnnuelle;
    this._dateValeurCibleAnnuelle = dateValeurCibleAnnuelle;
    this._tauxAvancementAnnuel = tauxAvancementAnnuel;
    this._valeurCibleGlobale = valeurCibleGlobale;
    this._dateValeurCibleGlobale = dateValeurCibleGlobale;
    this._tauxAvancementGlobale = tauxAvancementGlobale;
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

  get valeurActuelle(): number | null {
    return this._valeurActuelle;
  }

  get dateValeurActuelle(): Date | null {
    return this._dateValeurActuelle;
  }

  get valeurCibleAnnuelle(): number | null {
    return this._valeurCibleAnnuelle;
  }

  get dateValeurCibleAnnuelle(): Date | null {
    return this._dateValeurCibleAnnuelle;
  }

  get tauxAvancementAnnuel(): number | null {
    return this._tauxAvancementAnnuel;
  }

  get valeurCibleGlobale(): number | null {
    return this._valeurCibleGlobale;
  }

  get dateValeurCibleGlobale(): Date | null {
    return this._dateValeurCibleGlobale;
  }

  get tauxAvancementGlobale(): number | null {
    return this._tauxAvancementGlobale;
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
    valeurActuelle,
    dateValeurActuelle,
    valeurCibleAnnuelle,
    dateValeurCibleAnnuelle,
    tauxAvancementAnnuel,
    valeurCibleGlobale,
    dateValeurCibleGlobale,
    tauxAvancementGlobale,
    estBarometre,
  }: {
    indicId: string,
    zoneId: string,
    maille: string,
    codeInsee: string,
    territoireCode: string,
    valeurInitiale: number | null,
    dateValeurInitiale: Date | null,
    valeurActuelle: number | null,
    dateValeurActuelle: Date | null,
    valeurCibleAnnuelle: number | null,
    dateValeurCibleAnnuelle: Date | null,
    tauxAvancementAnnuel: number | null,
    valeurCibleGlobale: number | null,
    dateValeurCibleGlobale: Date | null,
    tauxAvancementGlobale: number | null,
    estBarometre: boolean,
  }) {
    return new DonneeIndicateur({
      indicId,
      zoneId,
      maille,
      codeInsee,
      territoireCode,
      valeurInitiale,
      dateValeurInitiale,
      valeurActuelle,
      dateValeurActuelle,
      valeurCibleAnnuelle,
      dateValeurCibleAnnuelle,
      tauxAvancementAnnuel,
      valeurCibleGlobale,
      dateValeurCibleGlobale,
      tauxAvancementGlobale,
      estBarometre,
    });
  }

}
