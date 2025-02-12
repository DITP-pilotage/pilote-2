import { DonneeChantier } from '@/server/chantiers/domain/DonneeChantier';
import { formaterNumériqueOuValeurNonApplicable, NON_APPLICABLE } from '@/server/infrastructure/export_csv/valeurs';

type DonneeChantierPublication = {
  synthese_des_resultats: string | null
  notre_ambition: string | null
  ce_qui_a_deja_ete_fait: string | null
  ce_qui_reste_a_faire: string | null
  suivi_decisions_strategiques: string | null
  autres_resultats_non_coreeles_aux_indic: string | null
  risques_et_freins_a_lever: string | null
  solutions: string | null
  exemples_reussite: string | null
  commentaires_sur_les_donnees: string | null
  autres_resultats: string | null
};

type DonneeTerritoireChantierContrat = {
  maille: string;
  territoire_code: string
  meteo: string
  responsables_locaux: string
  responsable_locaux_mails: string
  taux_avancement_dept: string
  taux_avancement_region: string
  taux_avancement_nat: string
  taux_avancement_annuel: string
  publication: DonneeChantierPublication
};

export type DonneeChantierContrat = {
  chantier_id: string;
  nom: string;
  axe: string;
  ministere: string | null;
  statut: string;
  est_barometre: boolean;
  est_territorialise: boolean;
  directeurs_projet: string;
  directeurs_projet_mails: string;
  donnees_territoires: DonneeTerritoireChantierContrat[];
};


export const presenterEnDonneeTerritoireChantierContrat = (donneeChantier: DonneeChantier): DonneeTerritoireChantierContrat => {
  return {
    maille: donneeChantier.maille,
    territoire_code: donneeChantier.territoireCode,
    meteo: donneeChantier.météo,
    responsables_locaux: donneeChantier.responsablesLocaux?.join(',') || NON_APPLICABLE,
    responsable_locaux_mails: donneeChantier.responsablesLocauxMails?.join(',') || NON_APPLICABLE,
    taux_avancement_dept: formaterNumériqueOuValeurNonApplicable(donneeChantier.tauxDAvancementDépartemental),
    taux_avancement_region: formaterNumériqueOuValeurNonApplicable(donneeChantier.tauxDAvancementRégional),
    taux_avancement_nat: formaterNumériqueOuValeurNonApplicable(donneeChantier.tauxDAvancementNational),
    taux_avancement_annuel: formaterNumériqueOuValeurNonApplicable(donneeChantier.tauxDAvancementAnnuel),
    publication: {
      synthese_des_resultats: donneeChantier.synthèseDesRésultats,
      notre_ambition: donneeChantier.objNotreAmbition,
      ce_qui_a_deja_ete_fait: donneeChantier.objDéjàFait,
      ce_qui_reste_a_faire: donneeChantier.objÀFaire,
      suivi_decisions_strategiques: donneeChantier.decStratSuiviDesDécisions,
      autres_resultats_non_coreeles_aux_indic: donneeChantier.commAutresRésultatsNonCorrélésAuxIndicateurs,
      risques_et_freins_a_lever: donneeChantier.commFreinsÀLever,
      solutions: donneeChantier.commActionsÀVenir,
      exemples_reussite: donneeChantier.commActionsÀValoriser,
      commentaires_sur_les_donnees: donneeChantier.commCommentairesSurLesDonnées,
      autres_resultats: donneeChantier.commAutresRésultats,
    },
  };
};

export const presenterEnDonneeChantierContrat = (listeDonneesChantier: DonneeChantier[]): DonneeChantierContrat => {
  const chantier = listeDonneesChantier[0];
  return {
    chantier_id: chantier.id,
    nom: chantier.nom,
    axe: chantier.axe,
    ministere: chantier.ministèreNom,
    statut: chantier.statut,
    est_barometre: chantier.estBaromètre,
    est_territorialise: chantier.estTerritorialisé, 
    directeurs_projet: chantier.directeursProjet?.join(',') || NON_APPLICABLE,
    directeurs_projet_mails: chantier.directeursProjetMails?.join(',') || NON_APPLICABLE,
    donnees_territoires: listeDonneesChantier.map(presenterEnDonneeTerritoireChantierContrat),
  };
};
