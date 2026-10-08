import { Avancement } from "@/shared/chantier/avancement/Avancement.interface";
import { CodeInsee } from "@/shared/territoire/Territoire.interface";
import { EvenementValeurEnum } from "@/shared/indicateur/EvenementValeurEnum";
import { Indicateur } from "./Indicateur.interface";

export type DétailsIndicateurTerritoire = Record<CodeInsee, DétailsIndicateur>;
export type DétailsIndicateurs = Record<
  Indicateur["id"],
  DétailsIndicateurTerritoire
>;

export type PropositionStatutTerritoire = {
  statut:
    | EvenementValeurEnum.PROPOSITION_VALEUR_CREEE
    | EvenementValeurEnum.PROPOSITION_VALEUR_MODIFIEE
    | EvenementValeurEnum.PROPOSITION_VALEUR_SUPPRIMEE;
  date: string;
  dateTime: string;
} | null;

export type PropositionStatutDirectionProjet = {
  statut:
    | EvenementValeurEnum.PROPOSITION_VALEUR_REFUSEE
    | EvenementValeurEnum.PROPOSITION_VALEUR_ACCUSEE_RECEPTION
    | EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE
    | EvenementValeurEnum.PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION;
  date: string;
  dateTime: string;
} | null;

interface DetailIndicateurPropositionValeurAvancement {
  valeurAvancement: number;
  dateValeurAvancement: string;
  tauxAvancement: number | null;
  statutTauxAvancement: "CALCULE" | "EN_COURS";
  tauxAvancementIntermediaire: number | null;
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
