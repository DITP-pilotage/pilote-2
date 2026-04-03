import type { Dispatch, SetStateAction } from "react";
import type { ECOption } from "./useIndicateurEvolutionNew";

export type ChartDisplayMode = "default" | "compact";

export type TerritoireEvolutionDonnees = {
  territoireCode: string;
  données: {
    historiquesValeurs: { date: string; valeur: number }[];
    listeValeursCiblesAnnuelles: {
      annee: number;
      valeurCible: number | null;
    }[];
  };
};

export type BaseEvolutionMode = "impression" | "default";

export interface ChartConfig {
  getOptions: (args: {
    modeImpression: boolean;
    chartDisplayMode: ChartDisplayMode;
  }) => ECOption;
  tousLesIndicateursDetails: TerritoireEvolutionDonnees[];
  territoiresAAfficher: Record<string, boolean>;
  setTerritoiresAAfficher: Dispatch<Record<string, boolean>>;
  afficherLesCibles: boolean;
  setAfficherLesCibles: Dispatch<SetStateAction<boolean>>;
  periodeSelectionnee: string;
  changerLaPeriodeSelectionnee: (periode: string) => void;
  periodesSelectionnablesZoom: string[];
}

export interface IndicatorMetadata {
  nom: string;
  id: string;
  dateDeMiseAJour: string | null;
  source: string | null;
}
