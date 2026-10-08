import {
  PropositionStatutDirectionProjet,
  PropositionStatutTerritoire,
} from "@/shared/indicateur/DetailsIndicateur.interface";
import { Avancement } from "@/shared/chantier/avancement/Avancement.interface";
import { CodeInsee } from "@/shared/territoire/Territoire.interface";

export type DetailsIndicateurTerritoire = Record<CodeInsee, DetailsIndicateur>;
export type DetailsIndicateurs = Record<string, DetailsIndicateurTerritoire>;

export interface DetailIndicateurPropositionValeurAvancement {
  dateValeurAvancement: string;
  valeurAvancement: number;
  tauxAvancement: number | null;
  tauxAvancementIntermediaire: number | null;
  statutTauxAvancement: "CALCULE" | "EN_COURS";
  auteur: string | null;
  auteurService: string | null;
  auteurFonction: string | null;
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
  propositionStatutTerritoire: PropositionStatutTerritoire;
  propositionStatutDirectionProjet: PropositionStatutDirectionProjet;
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
