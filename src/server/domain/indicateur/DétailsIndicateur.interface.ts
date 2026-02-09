import { Avancement } from "@/server/domain/chantier/avancement/Avancement.interface";
import { CodeInsee } from "@/server/domain/territoire/Territoire.interface";
import { DetailsIndicateur } from "@/server/chantiers/domain/DetailsIndicateurs";
import Indicateur from "./Indicateur.interface";

export type DétailsIndicateurTerritoire = Record<CodeInsee, DétailsIndicateur>;
export type DétailsIndicateurs = Record<
  Indicateur["id"],
  DétailsIndicateurTerritoire
>;

interface DetailIndicateurPropositionValeurAvancement {
  valeurAvancement: number;
  dateValeurAvancement: string;
  tauxAvancement: number | null;
  statutTauxAvancement: "CALCULE" | "EN_COURS";
  tauxAvancementIntermediaire: number | null;
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

export type DétailsIndicateur = {
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
  propositionStatutTerritoire: DetailsIndicateur["propositionStatutTerritoire"];
  propositionStatutDirectionProjet: DetailsIndicateur["propositionStatutDirectionProjet"];
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
