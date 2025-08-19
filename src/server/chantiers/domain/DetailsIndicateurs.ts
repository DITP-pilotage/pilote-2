import { Avancement } from "@/server/domain/chantier/avancement/Avancement.interface";
import { CodeInsee } from "@/server/domain/territoire/Territoire.interface";

export type DetailsIndicateurTerritoire = Record<CodeInsee, DetailsIndicateur>;
export type DetailsIndicateurs = Record<string, DetailsIndicateurTerritoire>;

export interface DetailIndicateurPropositionValeurAvancement {
  valeurAvancement: number;
  tauxAvancement: number | null;
  tauxAvancementIntermediaire: number | null;
  auteur: string | null;
  dateProposition: string | null;
  motif: string | null;
  sourceDonneeEtMethodeCalcul: string | null;
}

interface HistoriqueValeur {
  date: string;
  valeur: number;
}

interface ValeurCibleAnnuelle {
  annee: number;
  valeurCible: number | null;
}

export type DetailsIndicateur = {
  codeInsee: string;
  valeurInitiale: number | null;
  dateValeurInitiale: string | null;
  historiquesValeurs: HistoriqueValeur[];
  valeurAvancementMandat: number | null;
  valeurAvancement: number | null;
  dateValeurAvancement: string | null;
  dateValeurAvancementMandat: string | null;
  valeurCible: number | null;
  dateValeurCible: string | null;
  valeurCibleAnnuelle: number | null;
  dateValeurCibleAnnuelle: string | null;
  avancement: Avancement;
  proposition: DetailIndicateurPropositionValeurAvancement | null;
  propositionStatutTerritoire: {
    statut:
      | "PROPOSITION_VALEUR_CREEE"
      | "PROPOSITION_VALEUR_MODIFIEE"
      | "PROPOSITION_VALEUR_SUPPRIMEE";
    date: string;
  } | null;
  propositionStatutDirectionProjet: {
    statut:
      | "PROPOSITION_VALEUR_REFUSEE"
      | "PROPOSITION_VALEUR_ACCUSEE_RECEPTION";
    date: string;
  } | null;
  unite: string | null;
  estApplicable: boolean | null;
  dateImport: string | null;
  ponderation: number | null;
  prochaineDateValeurAvancement: string | null;
  prochaineDateMaj: string | null;
  prochaineDateMajJours: number | null;
  estAJour: boolean | null;
  tendance: string | null;
  listeValeursCiblesAnnuelles: ValeurCibleAnnuelle[];
};
