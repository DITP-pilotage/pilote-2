import { MetadataParametrageIndicateur } from '@/server/parametrage-indicateur/domain/MetadataParametrageIndicateur';

export interface HistorisationMetadataIndicateurComplementaire {
  indic_id: string;

  reforme_prioritaire: string | null;

  projet_annuel_perf: boolean;

  detail_projet_annuel_perf: string | null;

  periodicite: string;

  delai_disponibilite: number;

  indic_territorialise: boolean;

  frequence_territoriale: number;

  mailles: string | null;

  admin_source: string;

  methode_collecte: string | null;

  si_source: string | null;

  donnee_ouverte: boolean;

  modalites_donnee_ouverte: string | null;

  resp_donnees: string | null;

  resp_donnees_email: string | null;

  contact_technique: string | null;

  contact_technique_email: string;

  commentaire: string | null;
}

export function convertirEnHistorisationMetadataIndicateurComplementaireModel(metadataParametrageIndicateur: MetadataParametrageIndicateur): HistorisationMetadataIndicateurComplementaire {
  return {
    indic_id: metadataParametrageIndicateur.indicId,
    reforme_prioritaire: metadataParametrageIndicateur.reformePrioritaire,
    projet_annuel_perf: metadataParametrageIndicateur.projetAnnuelPerf,
    detail_projet_annuel_perf: metadataParametrageIndicateur.detailProjetAnnuelPerf,
    periodicite: metadataParametrageIndicateur.periodicite,
    delai_disponibilite: metadataParametrageIndicateur.delaiDisponibilite,
    indic_territorialise: metadataParametrageIndicateur.indicTerritorialise,
    frequence_territoriale: metadataParametrageIndicateur.frequenceTerritoriale,
    mailles: metadataParametrageIndicateur.mailles,
    admin_source: metadataParametrageIndicateur.adminSource,
    methode_collecte: metadataParametrageIndicateur.methodeCollecte,
    si_source: metadataParametrageIndicateur.siSource,
    donnee_ouverte: metadataParametrageIndicateur.donneeOuverte,
    modalites_donnee_ouverte: metadataParametrageIndicateur.modalitesDonneeOuverte,
    resp_donnees: metadataParametrageIndicateur.respDonnees,
    resp_donnees_email: metadataParametrageIndicateur.respDonneesEmail,
    contact_technique: metadataParametrageIndicateur.contactTechnique,
    contact_technique_email: metadataParametrageIndicateur.contactTechniqueEmail,
    commentaire: metadataParametrageIndicateur.commentaire,
  };
}
