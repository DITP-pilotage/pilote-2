export interface ImportMetadataIndicateur {
  indicId: string
  indicParentIndic: string | null;
  indicParentCh: string
  indicNom: string
  indicNomBaro: string | null
  indicDescr: string
  indicDescrBaro: string | null
  indicIsPerseverant: boolean
  indicIsPhare: boolean
  indicIsBaro: boolean
  indicType: string
  indicSource: string
  indicSourceUrl: string | null
  indicMethodeCalcul: string
  indicUnite: string | null
  indicHiddenPilote: boolean
  indicSchema: string
  zgApplicable: string | null;
  viDeptFrom: string
  viDeptOp: string
  vaDeptFrom: string
  vaDeptOp: string
  vcDeptFrom: string
  vcDeptOp: string
  viRegFrom: string
  viRegOp: string
  vaRegFrom: string
  vaRegOp: string
  vcRegFrom: string
  vcRegOp: string
  viNatFrom: string
  viNatOp: string
  vaNatFrom: string
  vaNatOp: string
  vcNatFrom: string
  vcNatOp: string
  paramVacaDecumulFrom: string
  paramVacaPartitionDate: string
  paramVacaOp: string
  paramVacgDecumulFrom: string
  paramVacgPartitionDate: string
  paramVacgOp: string
  poidsPourcentDept: string
  poidsPourcentReg: string
  poidsPourcentNat: string
  tendance: string
  reformePrioritaire: string | null
  projetAnnuelPerf: boolean
  detailProjetAnnuelPerf: string | null
  periodicite: string
  delaiDisponibilite: number
  indicTerritorialise: boolean
  frequenceTerritoriale: number
  mailles: string | null
  adminSource: string
  methodeCollecte: string
  siSource: string | null
  donneeOuverte: boolean
  modalitesDonneeOuverte: string | null
  respDonnees: string | null
  respDonneesEmail: string | null
  contactTechnique: string | null
  contactTechniqueEmail: string
  commentaire: string | null
}
