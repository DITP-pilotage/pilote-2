import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { ChartData, ChartOptions } from "chart.js";
import type { ECOption } from "./useIndicateurEvolutionNew";
import type { IndicateurDétailsParTerritoire } from "../../IndicateurBloc.interface";

export type BaseEvolutionMode = "impression" | "default";

export interface ChartConfig {
  option: ECOption;
  tousLesIndicateursDetails: IndicateurDétailsParTerritoire[];
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

export interface BaseEvolutionProps {
  mode: BaseEvolutionMode;
  actions?: ReactNode;
  indicateur: IndicatorMetadata;
  chartConfig: ChartConfig;
  donnéesParTerritoire: ChartData<"line">;
  optionsLegacy: ChartOptions<"line">;
  nouveauxGraphiquesSontActifs: boolean;
}
