interface InputMetadataParametrageIndicateur {
  indicId: string;
  chantierNom: string;
  indicParentIndic: string | null;
  indicParentCh: string;
  indicNom: string;
  indicNomBaro: string | null;
  indicDescr: string;
  indicDescrBaro: string | null;
  indicIsPerseverant: boolean;
  indicIsPhare: boolean;
  indicIsBaro: boolean;
  indicType: string;
  indicSource: string;
  indicSourceUrl: string | null;
  indicMethodeCalcul: string;
  indicUnite: string | null;
  indicHiddenPilote: boolean;
  indicSchema: string;
  zgApplicable: string | null;
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
  reformePrioritaire: string | null;
  projetAnnuelPerf: boolean;
  detailProjetAnnuelPerf: string | null;
  periodicite: string;
  delaiDisponibilite: number;
  indicTerritorialise: boolean;
  frequenceTerritoriale: string | null;
  mailles: string | null;
  adminSource: string;
  methodeCollecte: string | null;
  siSource: string | null;
  donneeOuverte: boolean;
  modalitesDonneeOuverte: string | null;
  respDonnees: string | null;
  respDonneesEmail: string | null;
  contactTechnique: string | null;
  contactTechniqueEmail: string;
  commentaire: string | null;
}

export class MetadataParametrageIndicateur {
  private readonly _indicId: string;

  private readonly _viDeptFrom: string;

  private readonly _viDeptOp: string;

  private readonly _vaDeptFrom: string;

  private readonly _vaDeptOp: string;

  private readonly _vcDeptFrom: string;

  private readonly _vcDeptOp: string;

  private readonly _viRegFrom: string;

  private readonly _viRegOp: string;

  private readonly _vaRegFrom: string;

  private readonly _vaRegOp: string;

  private readonly _vcRegFrom: string;

  private readonly _vcRegOp: string;

  private readonly _viNatFrom: string;

  private readonly _viNatOp: string;

  private readonly _vaNatFrom: string;

  private readonly _vaNatOp: string;

  private readonly _vcNatFrom: string;

  private readonly _vcNatOp: string;

  private readonly _paramVacaDecumulFrom: string;

  private readonly _paramVacaPartitionDate: string;

  private readonly _paramVacaOp: string;

  private readonly _paramVacgDecumulFrom: string;

  private readonly _paramVacgPartitionDate: string;

  private readonly _paramVacgOp: string;

  private readonly _poidsPourcentDept: number;

  private readonly _poidsPourcentReg: number;

  private readonly _poidsPourcentNat: number;

  private readonly _tendance: string;

  private readonly _indicParentIndic: string | null;

  private readonly _indicParentCh: string;

  private readonly _indicNom: string;

  private readonly _indicNomBaro: string | null;

  private readonly _indicDescr: string;

  private readonly _indicDescrBaro: string | null;

  private readonly _indicIsPerseverant: boolean;

  private readonly _indicIsPhare: boolean;

  private readonly _indicIsBaro: boolean;

  private readonly _indicType: string;

  private readonly _indicSource: string;

  private readonly _indicSourceUrl: string | null;

  private readonly _indicMethodeCalcul: string;

  private readonly _indicUnite: string | null;

  private readonly _indicHiddenPilote: boolean;

  private readonly _indicSchema: string;

  private readonly _zgApplicable: string | null;

  private readonly _chantierNom: string;

  private readonly _reformePrioritaire: string | null;

  private readonly _projetAnnuelPerf: boolean;

  private readonly _detailProjetAnnuelPerf: string | null;

  private readonly _periodicite: string;

  private readonly _delaiDisponibilite: number;

  private readonly _indicTerritorialise: boolean;

  private readonly _frequenceTerritoriale: string | null;

  private readonly _mailles: string | null;

  private readonly _adminSource: string;

  private readonly _methodeCollecte: string | null;

  private readonly _siSource: string | null;

  private readonly _donneeOuverte: boolean;

  private readonly _modalitesDonneeOuverte: string | null;

  private readonly _respDonnees: string | null;

  private readonly _respDonneesEmail: string | null;

  private readonly _contactTechnique: string | null;

  private readonly _contactTechniqueEmail: string;

  private readonly _commentaire: string | null;

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
    zgApplicable,
    chantierNom,
    reformePrioritaire,
    projetAnnuelPerf,
    detailProjetAnnuelPerf,
    periodicite,
    delaiDisponibilite,
    indicTerritorialise,
    frequenceTerritoriale,
    mailles,
    adminSource,
    methodeCollecte,
    siSource,
    donneeOuverte,
    modalitesDonneeOuverte,
    respDonnees,
    respDonneesEmail,
    contactTechnique,
    contactTechniqueEmail,
    commentaire,
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
    this._zgApplicable = zgApplicable;
    this._chantierNom = chantierNom;
    this._reformePrioritaire = reformePrioritaire;
    this._projetAnnuelPerf = projetAnnuelPerf;
    this._detailProjetAnnuelPerf = detailProjetAnnuelPerf;
    this._periodicite = periodicite;
    this._delaiDisponibilite = delaiDisponibilite;
    this._indicTerritorialise = indicTerritorialise;
    this._frequenceTerritoriale = frequenceTerritoriale;
    this._mailles = mailles;
    this._adminSource = adminSource;
    this._methodeCollecte = methodeCollecte;
    this._siSource = siSource;
    this._donneeOuverte = donneeOuverte;
    this._modalitesDonneeOuverte = modalitesDonneeOuverte;
    this._respDonnees = respDonnees;
    this._respDonneesEmail = respDonneesEmail;
    this._contactTechnique = contactTechnique;
    this._contactTechniqueEmail = contactTechniqueEmail;
    this._commentaire = commentaire;
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

  get indicParentIndic(): string | null {
    return this._indicParentIndic;
  }

  get indicParentCh(): string {
    return this._indicParentCh;
  }

  get indicNom(): string {
    return this._indicNom;
  }

  get indicNomBaro(): string | null {
    return this._indicNomBaro;
  }

  get indicDescr(): string {
    return this._indicDescr;
  }

  get indicDescrBaro(): string | null {
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

  get indicSourceUrl(): string | null {
    return this._indicSourceUrl;
  }

  get indicMethodeCalcul(): string {
    return this._indicMethodeCalcul;
  }

  get indicUnite(): string | null {
    return this._indicUnite;
  }

  get indicHiddenPilote(): boolean {
    return this._indicHiddenPilote;
  }

  get indicSchema(): string {
    return this._indicSchema;
  }

  get zgApplicable(): string | null {
    return this._zgApplicable;
  }

  get chantierNom(): string {
    return this._chantierNom;
  }

  get reformePrioritaire(): string | null {
    return this._reformePrioritaire;
  }

  get projetAnnuelPerf(): boolean {
    return this._projetAnnuelPerf;
  }

  get detailProjetAnnuelPerf(): string | null {
    return this._detailProjetAnnuelPerf;
  }

  get periodicite(): string {
    return this._periodicite;
  }

  get delaiDisponibilite(): number {
    return this._delaiDisponibilite;
  }

  get indicTerritorialise(): boolean {
    return this._indicTerritorialise;
  }

  get frequenceTerritoriale(): string | null {
    return this._frequenceTerritoriale;
  }

  get mailles(): string | null {
    return this._mailles;
  }

  get adminSource(): string {
    return this._adminSource;
  }

  get methodeCollecte(): string | null {
    return this._methodeCollecte;
  }

  get siSource(): string | null {
    return this._siSource;
  }

  get donneeOuverte(): boolean {
    return this._donneeOuverte;
  }

  get modalitesDonneeOuverte(): string | null {
    return this._modalitesDonneeOuverte;
  }

  get respDonnees(): string | null {
    return this._respDonnees;
  }

  get respDonneesEmail(): string | null {
    return this._respDonneesEmail;
  }

  get contactTechnique(): string | null {
    return this._contactTechnique;
  }

  get contactTechniqueEmail(): string {
    return this._contactTechniqueEmail;
  }

  get commentaire(): string | null {
    return this._commentaire;
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
    zgApplicable,
    chantierNom,
    reformePrioritaire,
    projetAnnuelPerf,
    detailProjetAnnuelPerf,
    periodicite,
    delaiDisponibilite,
    indicTerritorialise,
    frequenceTerritoriale,
    mailles,
    adminSource,
    methodeCollecte,
    siSource,
    donneeOuverte,
    modalitesDonneeOuverte,
    respDonnees,
    respDonneesEmail,
    contactTechnique,
    contactTechniqueEmail,
    commentaire,
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
      zgApplicable,
      chantierNom,
      reformePrioritaire,
      projetAnnuelPerf,
      detailProjetAnnuelPerf,
      periodicite,
      delaiDisponibilite,
      indicTerritorialise,
      frequenceTerritoriale,
      mailles,
      adminSource,
      methodeCollecte,
      siSource,
      donneeOuverte,
      modalitesDonneeOuverte,
      respDonnees,
      respDonneesEmail,
      contactTechnique,
      contactTechniqueEmail,
      commentaire,
    });
  }
}
