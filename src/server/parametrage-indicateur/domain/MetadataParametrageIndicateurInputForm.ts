export interface MetadataParametrageIndicateurForm {
  indicId: string;
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
  indicHiddenPilote: boolean;
  indicSchema: string;
  zgApplicable: string;
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
  reformePrioritaire: string;
  projetAnnuelPerf: string;
  detailProjetAnnuelPerf: string;
  periodicite: string;
  delaiDisponibilite: number;
  indicTerritorialise: string;
  frequenceTerritoriale: string;
  mailles: string;
  adminSource: string;
  methodeCollecte: string;
  siSource: string;
  donneeOuverte: string;
  modalitesDonneeOuverte: string;
  respDonnees: string;
  respDonneesEmail: string;
  contactTechnique: string;
  contactTechniqueEmail: string;
  commentaires: string;
}
