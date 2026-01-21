import type { Dispatch, SetStateAction } from "react";
import type { IndicateurDetailsParTerritoire } from "@/client/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface";
import type { ECOption } from "./useIndicateurEvolutionNew";

export type BaseEvolutionMode = "impression" | "default";

export interface ChartConfig {
  getOptions: (modeImpresssion: boolean) => ECOption;
  tousLesIndicateursDetails: IndicateurDetailsParTerritoire[];
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
