import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';

export interface MetadataParametrageIndicateurContrat {
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
  chantierNom: string;
  reformePrioritaire: string | null;
  projetAnnuelPerf: boolean;
  detailProjetAnnuelPerf: string | null;
  periodicite: string;
  delaiDisponibilite: number;
  indicTerritorialise: boolean;
  frequenceTerritoriale: number;
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

export const presenterEnMetadataParametrageIndicateurContrat = (metadataParametrageIndicateur: MetadataParametrageIndicateur): MetadataParametrageIndicateurContrat => ({
  indicId: metadataParametrageIndicateur.indicId,
  viDeptFrom: metadataParametrageIndicateur.viDeptFrom,
  viDeptOp: metadataParametrageIndicateur.viDeptOp,
  vaDeptFrom: metadataParametrageIndicateur.vaDeptFrom,
  vaDeptOp: metadataParametrageIndicateur.vaDeptOp,
  vcDeptFrom: metadataParametrageIndicateur.vcDeptFrom,
  vcDeptOp: metadataParametrageIndicateur.vcDeptOp,
  viRegFrom: metadataParametrageIndicateur.viRegFrom,
  viRegOp: metadataParametrageIndicateur.viRegOp,
  vaRegFrom: metadataParametrageIndicateur.vaRegFrom,
  vaRegOp: metadataParametrageIndicateur.vaRegOp,
  vcRegFrom: metadataParametrageIndicateur.vcRegFrom,
  vcRegOp: metadataParametrageIndicateur.vcRegOp,
  viNatFrom: metadataParametrageIndicateur.viNatFrom,
  viNatOp: metadataParametrageIndicateur.viNatOp,
  vaNatFrom: metadataParametrageIndicateur.vaNatFrom,
  vaNatOp: metadataParametrageIndicateur.vaNatOp,
  vcNatFrom: metadataParametrageIndicateur.vcNatFrom,
  vcNatOp: metadataParametrageIndicateur.vcNatOp,
  paramVacaDecumulFrom: metadataParametrageIndicateur.paramVacaDecumulFrom,
  paramVacaPartitionDate: metadataParametrageIndicateur.paramVacaPartitionDate,
  paramVacaOp: metadataParametrageIndicateur.paramVacaOp,
  paramVacgDecumulFrom: metadataParametrageIndicateur.paramVacgDecumulFrom,
  paramVacgPartitionDate: metadataParametrageIndicateur.paramVacgPartitionDate,
  paramVacgOp: metadataParametrageIndicateur.paramVacgOp,
  poidsPourcentDept: metadataParametrageIndicateur.poidsPourcentDept,
  poidsPourcentReg: metadataParametrageIndicateur.poidsPourcentReg,
  poidsPourcentNat: metadataParametrageIndicateur.poidsPourcentNat,
  tendance: metadataParametrageIndicateur.tendance,
  indicParentIndic: metadataParametrageIndicateur.indicParentIndic,
  indicParentCh: metadataParametrageIndicateur.indicParentCh,
  indicNom: metadataParametrageIndicateur.indicNom,
  indicNomBaro: metadataParametrageIndicateur.indicNomBaro,
  indicDescr: metadataParametrageIndicateur.indicDescr,
  indicDescrBaro: metadataParametrageIndicateur.indicDescrBaro,
  indicIsPerseverant: metadataParametrageIndicateur.indicIsPerseverant,
  indicIsPhare: metadataParametrageIndicateur.indicIsPhare,
  indicIsBaro: metadataParametrageIndicateur.indicIsBaro,
  indicType: metadataParametrageIndicateur.indicType,
  indicSource: metadataParametrageIndicateur.indicSource,
  indicSourceUrl: metadataParametrageIndicateur.indicSourceUrl,
  indicMethodeCalcul: metadataParametrageIndicateur.indicMethodeCalcul,
  indicUnite: metadataParametrageIndicateur.indicUnite,
  indicHiddenPilote: metadataParametrageIndicateur.indicHiddenPilote,
  indicSchema: metadataParametrageIndicateur.indicSchema,
  zgApplicable: metadataParametrageIndicateur.zgApplicable,
  chantierNom: metadataParametrageIndicateur.chantierNom,
  reformePrioritaire: metadataParametrageIndicateur.reformePrioritaire,
  projetAnnuelPerf: metadataParametrageIndicateur.projetAnnuelPerf,
  detailProjetAnnuelPerf: metadataParametrageIndicateur.detailProjetAnnuelPerf,
  periodicite: metadataParametrageIndicateur.periodicite,
  delaiDisponibilite: metadataParametrageIndicateur.delaiDisponibilite,
  indicTerritorialise: metadataParametrageIndicateur.indicTerritorialise,
  frequenceTerritoriale: metadataParametrageIndicateur.frequenceTerritoriale,
  mailles: metadataParametrageIndicateur.mailles,
  adminSource: metadataParametrageIndicateur.adminSource,
  methodeCollecte: metadataParametrageIndicateur.methodeCollecte,
  siSource: metadataParametrageIndicateur.siSource,
  donneeOuverte: metadataParametrageIndicateur.donneeOuverte,
  modalitesDonneeOuverte: metadataParametrageIndicateur.modalitesDonneeOuverte,
  respDonnees: metadataParametrageIndicateur.respDonnees,
  respDonneesEmail: metadataParametrageIndicateur.respDonneesEmail,
  contactTechnique: metadataParametrageIndicateur.contactTechnique,
  contactTechniqueEmail: metadataParametrageIndicateur.contactTechniqueEmail,
  commentaire: metadataParametrageIndicateur.commentaire,
});
