import { DonneeIndicateur } from "@/server/chantiers/domain/DonneeIndicateur";

export interface DonneeTerritoireContrat {
  valeur_cible: number | null;
  territoire_code: string;
  code_insee: string;
  date_valeur_cible: Date | null;
  valeur_initiale: number | null;
  valeur_avancement: number | null;
  date_valeur_avancement: Date | null;
  zone_id: string;
  date_valeur_initiale: Date | null;
  maille: string;
  taux_avancement: number | null;
}

export interface DonneeIndicateurContrat {
  indic_id: string;
  est_barometre: boolean;
  chantier_id: string;
  donnees_territoires: DonneeTerritoireContrat[];
}

export const presenterEnDonneeIndicateurContrat = (
  chantierId: string,
  listeDonneesIndicateurs: DonneeIndicateur[],
): DonneeIndicateurContrat => {
  return {
    indic_id: listeDonneesIndicateurs[0].indicId,
    est_barometre: listeDonneesIndicateurs[0].estBarometre,
    chantier_id: chantierId,
    donnees_territoires: listeDonneesIndicateurs.map((donneeIndicateur) => ({
      maille: donneeIndicateur.maille,
      code_insee: donneeIndicateur.codeInsee,
      territoire_code: donneeIndicateur.territoireCode,
      zone_id: donneeIndicateur.zoneId,
      valeur_initiale: donneeIndicateur.valeurInitiale,
      date_valeur_initiale: donneeIndicateur.dateValeurInitiale,
      valeur_actuelle: donneeIndicateur.valeurAvancement,
      date_valeur_actuelle: donneeIndicateur.dateValeurAvancement,
      valeur_avancement: donneeIndicateur.valeurAvancement,
      date_valeur_avancement: donneeIndicateur.dateValeurAvancement,
      valeur_cible: donneeIndicateur.valeurCible,
      date_valeur_cible: donneeIndicateur.dateValeurCible,
      taux_avancement: donneeIndicateur.tauxAvancement,
    })),
  };
};
