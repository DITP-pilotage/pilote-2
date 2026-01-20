import { Avancement } from "@/server/domain/chantier/avancement/Avancement.interface";
import { CodeInsee } from "@/server/domain/territoire/Territoire.interface";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";

export type DetailsIndicateurTerritoire = Record<CodeInsee, DetailsIndicateur>;
export type DetailsIndicateurs = Record<string, DetailsIndicateurTerritoire>;

export interface DetailIndicateurPropositionValeurAvancement {
  dateValeurAvancement: string;
  valeurAvancement: number;
  tauxAvancement: number | null;
  tauxAvancementIntermediaire: number | null;
  statutTauxAvancement: "CALCULE" | "EN_COURS";
  auteur: string | null;
  dateProposition: string | null;
  motif: string | null;
  sourceDonneeEtMethodeCalcul: string | null;
}

interface HistoriqueValeur {
  date: string;
  valeur: number;
  taux_avancement_jalon?: number | null;
  taux_avancement_mandat?: number | null;
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
      | EvenementValeurEnum.PROPOSITION_VALEUR_CREEE
      | EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE
      | EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE;
    date: string;
    dateTime: string;
  } | null;
  propositionStatutDirectionProjet: {
    statut:
      | EvenementValeurEnum.PROPOSITION_VALEUR_REFUSEE
      | EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION
      | EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE
      | EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION;
    date: string;
    dateTime: string;
  } | null;
  unite: string | null;
  estApplicable: boolean | null;
  ponderation: number | null;
  prochaineDateValeurAvancement: string | null;
  prochaineDateMaj: string | null;
  prochaineDateMajJours: number | null;
  estAJour: boolean | null;
  tendance: string | null;
  listeValeursCiblesAnnuelles: ValeurCibleAnnuelle[];
};
