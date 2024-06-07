import { DonneeIndicateur } from '@/server/chantiers/domain/DonneeIndicateur';

interface DonneeTerritoireContrat {
  valeur_cible: number | null;
  territoire_code: string;
  valeur_cible_annuelle: number | null;
  code_insee: string;
  date_valeur_cible: Date | null;
  valeur_initiale: number | null;
  date_valeur_actuelle: Date | null;
  zone_id: string;
  valeur_actuelle: number | null;
  date_valeur_initiale: Date | null;
  maille: string;
  taux_avancement: number | null;
  date_valeur_cible_annuelle: Date | null;
  taux_avancement_annuel: number | null
}

interface DonneeIndicateurContrat {
  indic_id: string;
  est_barometre: boolean;
  chantier_id: string;
  donnees_territoires: DonneeTerritoireContrat[];
}
export const presenterEnDonneeIndicateurContrat = (chantierId: string, listeDonneesIndicateurs: DonneeIndicateur[]): DonneeIndicateurContrat => {
  return {
    indic_id: listeDonneesIndicateurs[0].indicId,
    est_barometre: listeDonneesIndicateurs[0].estBarometre,
    chantier_id: chantierId,
    donnees_territoires: listeDonneesIndicateurs.map(donneeIndicateur => ({
      maille: donneeIndicateur.maille,
      code_insee: donneeIndicateur.codeInsee,
      territoire_code: donneeIndicateur.territoireCode,
      zone_id: donneeIndicateur.zoneId,
      valeur_initiale: donneeIndicateur.valeurInitiale,
      date_valeur_initiale: donneeIndicateur.dateValeurInitiale,
      valeur_actuelle: donneeIndicateur.valeurActuelle,
      date_valeur_actuelle: donneeIndicateur.dateValeurActuelle,
      valeur_cible: donneeIndicateur.valeurCibleGlobale,
      date_valeur_cible: donneeIndicateur.dateValeurCibleGlobale,
      taux_avancement: donneeIndicateur.tauxAvancementGlobale,
      valeur_cible_annuelle: donneeIndicateur.valeurCibleAnnuelle,
      date_valeur_cible_annuelle: donneeIndicateur.dateValeurCibleAnnuelle,
      taux_avancement_annuel: donneeIndicateur.tauxAvancementAnnuel,
    })),
  };
};
