interface InputMetadataParametrageIndicateur {
  indicId: string;
  viDeptFrom: string;
  viDeptOp: string;
  vaDeptFrom: string;
  vaDeptOp: string;
  vcDeptFrom: string;
  vcDeptOp: string;
  viRegFrom: string;
  viRegOp: string;
  vaRegFrom: string;
  vaRegOp: string;
  vcRegFrom: string;
  vcRegOp: string;
  viNatFrom: string;
  viNatOp: string;
  vaNatFrom: string;
  vaNatOp: string;
  vcNatFrom: string;
  vcNatOp: string;
  paramVacaDecumulFrom: string;
  paramVacaPartitionDate: string;
  paramVacaOp: string;
  paramVacgDecumulFrom: string;
  paramVacgPartitionDate: string;
  paramVacgOp: string;
  poidsPourcentDept: number;
  poidsPourcentReg: number;
  poidsPourcentNat: number;
  tendance: string;
  indicParentIndic: string;
  indicParentCh: string;
  indicNom: string;
  indicNomBaro: string;
  indicDescr: string;
  indicDescrBaro: string;
  indicIsPerseverant: boolean;
  indicIsPhare: boolean;
  indicIsBaro: boolean;
  indicType: string;
  indicSource: string;
  indicSourceUrl: string;
  indicMethodeCalcul: string;
  indicUnite: string;
  indicHiddenPilote: string;
  indicSchema: string;
  chantierNom: string;
}

export class MetadataParametrageIndicateur {
  private _indicId: string;

  private _viDeptFrom: string;

  private _viDeptOp: string;

  private _vaDeptFrom: string;

  private _vaDeptOp: string;

  private _vcDeptFrom: string;

  private _vcDeptOp: string;

  private _viRegFrom: string;

  private _viRegOp: string;

  private _vaRegFrom: string;

  private _vaRegOp: string;

  private _vcRegFrom: string;

  private _vcRegOp: string;

  private _viNatFrom: string;

  private _viNatOp: string;

  private _vaNatFrom: string;

  private _vaNatOp: string;

  private _vcNatFrom: string;

  private _vcNatOp: string;

  private _paramVacaDecumulFrom: string;

  private _paramVacaPartitionDate: string;

  private _paramVacaOp: string;

  private _paramVacgDecumulFrom: string;

  private _paramVacgPartitionDate: string;

  private _paramVacgOp: string;

  private _poidsPourcentDept: number;

  private _poidsPourcentReg: number;

  private _poidsPourcentNat: number;

  private _tendance: string;

  private _indicParentIndic: string;

  private _indicParentCh: string;

  private _indicNom: string;

  private _indicNomBaro: string;

  private _indicDescr: string;

  private _indicDescrBaro: string;

  private _indicIsPerseverant: boolean;

  private _indicIsPhare: boolean;

  private _indicIsBaro: boolean;

  private _indicType: string;

  private _indicSource: string;

  private _indicSourceUrl: string;

  private _indicMethodeCalcul: string;

  private _indicUnite: string;

  private _indicHiddenPilote: string;

  private _indicSchema: string;

  private _chantierNom: string;

  private constructor({
    indicId,
    viDeptFrom,
    viDeptOp,
    vaDeptFrom,
    vaDeptOp,
    vcDeptFrom,
    vcDeptOp,
    viRegFrom,
    viRegOp,
    vaRegFrom,
    vaRegOp,
    vcRegFrom,
    vcRegOp,
    viNatFrom,
    viNatOp,
    vaNatFrom,
    vaNatOp,
    vcNatFrom,
    vcNatOp,
    paramVacaDecumulFrom,
    paramVacaPartitionDate,
    paramVacaOp,
    paramVacgDecumulFrom,
    paramVacgPartitionDate,
    paramVacgOp,
    poidsPourcentDept,
    poidsPourcentReg,
    poidsPourcentNat,
    tendance,
    indicParentIndic,
    indicParentCh,
    indicNom,
    indicNomBaro,
    indicDescr,
    indicDescrBaro,
    indicIsPerseverant,
    indicIsPhare,
    indicIsBaro,
    indicType,
    indicSource,
    indicSourceUrl,
    indicMethodeCalcul,
    indicUnite,
    indicHiddenPilote,
    indicSchema,
    chantierNom,
  }: InputMetadataParametrageIndicateur) {
    this._indicId = indicId;
    this._viDeptFrom = viDeptFrom;
    this._viDeptOp = viDeptOp;
    this._vaDeptFrom = vaDeptFrom;
    this._vaDeptOp = vaDeptOp;
    this._vcDeptFrom = vcDeptFrom;
    this._vcDeptOp = vcDeptOp;
    this._viRegFrom = viRegFrom;
    this._viRegOp = viRegOp;
    this._vaRegFrom = vaRegFrom;
    this._vaRegOp = vaRegOp;
    this._vcRegFrom = vcRegFrom;
    this._vcRegOp = vcRegOp;
    this._viNatFrom = viNatFrom;
    this._viNatOp = viNatOp;
    this._vaNatFrom = vaNatFrom;
    this._vaNatOp = vaNatOp;
    this._vcNatFrom = vcNatFrom;
    this._vcNatOp = vcNatOp;
    this._paramVacaDecumulFrom = paramVacaDecumulFrom;
    this._paramVacaPartitionDate = paramVacaPartitionDate;
    this._paramVacaOp = paramVacaOp;
    this._paramVacgDecumulFrom = paramVacgDecumulFrom;
    this._paramVacgPartitionDate = paramVacgPartitionDate;
    this._paramVacgOp = paramVacgOp;
    this._poidsPourcentDept = poidsPourcentDept;
    this._poidsPourcentReg = poidsPourcentReg;
    this._poidsPourcentNat = poidsPourcentNat;
    this._tendance = tendance;
    this._indicParentIndic = indicParentIndic;
    this._indicParentCh = indicParentCh;
    this._indicNom = indicNom;
    this._indicNomBaro = indicNomBaro;
    this._indicDescr = indicDescr;
    this._indicDescrBaro = indicDescrBaro;
    this._indicIsPerseverant = indicIsPerseverant;
    this._indicIsPhare = indicIsPhare;
    this._indicIsBaro = indicIsBaro;
    this._indicType = indicType;
    this._indicSource = indicSource;
    this._indicSourceUrl = indicSourceUrl;
    this._indicMethodeCalcul = indicMethodeCalcul;
    this._indicUnite = indicUnite;
    this._indicHiddenPilote = indicHiddenPilote;
    this._indicSchema = indicSchema;
    this._chantierNom = chantierNom;
  }


  get indicId(): string {
    return this._indicId;
  }

  get viDeptFrom(): string {
    return this._viDeptFrom;
  }

  get viDeptOp(): string {
    return this._viDeptOp;
  }

  get vaDeptFrom(): string {
    return this._vaDeptFrom;
  }

  get vaDeptOp(): string {
    return this._vaDeptOp;
  }

  get vcDeptFrom(): string {
    return this._vcDeptFrom;
  }

  get vcDeptOp(): string {
    return this._vcDeptOp;
  }

  get viRegFrom(): string {
    return this._viRegFrom;
  }

  get viRegOp(): string {
    return this._viRegOp;
  }

  get vaRegFrom(): string {
    return this._vaRegFrom;
  }

  get vaRegOp(): string {
    return this._vaRegOp;
  }

  get vcRegFrom(): string {
    return this._vcRegFrom;
  }

  get vcRegOp(): string {
    return this._vcRegOp;
  }

  get viNatFrom(): string {
    return this._viNatFrom;
  }

  get viNatOp(): string {
    return this._viNatOp;
  }

  get vaNatFrom(): string {
    return this._vaNatFrom;
  }

  get vaNatOp(): string {
    return this._vaNatOp;
  }

  get vcNatFrom(): string {
    return this._vcNatFrom;
  }

  get vcNatOp(): string {
    return this._vcNatOp;
  }

  get paramVacaDecumulFrom(): string {
    return this._paramVacaDecumulFrom;
  }

  get paramVacaPartitionDate(): string {
    return this._paramVacaPartitionDate;
  }

  get paramVacaOp(): string {
    return this._paramVacaOp;
  }

  get paramVacgDecumulFrom(): string {
    return this._paramVacgDecumulFrom;
  }

  get paramVacgPartitionDate(): string {
    return this._paramVacgPartitionDate;
  }

  get paramVacgOp(): string {
    return this._paramVacgOp;
  }

  get poidsPourcentDept(): number {
    return this._poidsPourcentDept;
  }

  get poidsPourcentReg(): number {
    return this._poidsPourcentReg;
  }

  get poidsPourcentNat(): number {
    return this._poidsPourcentNat;
  }

  get tendance(): string {
    return this._tendance;
  }

  get indicParentIndic(): string {
    return this._indicParentIndic;
  }

  get indicParentCh(): string {
    return this._indicParentCh;
  }

  get indicNom(): string {
    return this._indicNom;
  }

  get indicNomBaro(): string {
    return this._indicNomBaro;
  }

  get indicDescr(): string {
    return this._indicDescr;
  }

  get indicDescrBaro(): string {
    return this._indicDescrBaro;
  }

  get indicIsPerseverant(): boolean {
    return this._indicIsPerseverant;
  }

  get indicIsPhare(): boolean {
    return this._indicIsPhare;
  }

  get indicIsBaro(): boolean {
    return this._indicIsBaro;
  }

  get indicType(): string {
    return this._indicType;
  }

  get indicSource(): string {
    return this._indicSource;
  }

  get indicSourceUrl(): string {
    return this._indicSourceUrl;
  }

  get indicMethodeCalcul(): string {
    return this._indicMethodeCalcul;
  }

  get indicUnite(): string {
    return this._indicUnite;
  }

  get indicHiddenPilote(): string {
    return this._indicHiddenPilote;
  }

  get indicSchema(): string {
    return this._indicSchema;
  }

  get chantierNom(): string {
    return this._chantierNom;
  }

  static creerMetadataParametrageIndicateur({
    indicId,
    viDeptFrom,
    viDeptOp,
    vaDeptFrom,
    vaDeptOp,
    vcDeptFrom,
    vcDeptOp,
    viRegFrom,
    viRegOp,
    vaRegFrom,
    vaRegOp,
    vcRegFrom,
    vcRegOp,
    viNatFrom,
    viNatOp,
    vaNatFrom,
    vaNatOp,
    vcNatFrom,
    vcNatOp,
    paramVacaDecumulFrom,
    paramVacaPartitionDate,
    paramVacaOp,
    paramVacgDecumulFrom,
    paramVacgPartitionDate,
    paramVacgOp,
    poidsPourcentDept,
    poidsPourcentReg,
    poidsPourcentNat,
    tendance,
    indicParentIndic,
    indicParentCh,
    indicNom,
    indicNomBaro,
    indicDescr,
    indicDescrBaro,
    indicIsPerseverant,
    indicIsPhare,
    indicIsBaro,
    indicType,
    indicSource,
    indicSourceUrl,
    indicMethodeCalcul,
    indicUnite,
    indicHiddenPilote,
    indicSchema,
    chantierNom,
  }: InputMetadataParametrageIndicateur): MetadataParametrageIndicateur {
    return new MetadataParametrageIndicateur({
      indicId,
      viDeptFrom,
      viDeptOp,
      vaDeptFrom,
      vaDeptOp,
      vcDeptFrom,
      vcDeptOp,
      viRegFrom,
      viRegOp,
      vaRegFrom,
      vaRegOp,
      vcRegFrom,
      vcRegOp,
      viNatFrom,
      viNatOp,
      vaNatFrom,
      vaNatOp,
      vcNatFrom,
      vcNatOp,
      paramVacaDecumulFrom,
      paramVacaPartitionDate,
      paramVacaOp,
      paramVacgDecumulFrom,
      paramVacgPartitionDate,
      paramVacgOp,
      poidsPourcentDept,
      poidsPourcentReg,
      poidsPourcentNat,
      tendance,
      indicParentIndic,
      indicParentCh,
      indicNom,
      indicNomBaro,
      indicDescr,
      indicDescrBaro,
      indicIsPerseverant,
      indicIsPhare,
      indicIsBaro,
      indicType,
      indicSource,
      indicSourceUrl,
      indicMethodeCalcul,
      indicUnite,
      indicHiddenPilote,
      indicSchema,
      chantierNom,
    });
  }
}
