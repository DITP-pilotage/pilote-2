import { forwardRef, type ReactNode } from "react";
import { Badge } from "@/components/shared/Badge";
import { LogoPilote } from "@/components/_commons/LogoPilote";
import LineChart from "./LineChart/LineChart";
import type {
  BaseEvolutionMode,
  ChartConfig,
  IndicatorMetadata,
} from "./types";

export const BaseIndicateurEvolution = forwardRef<
  HTMLElement,
  {
    mode: BaseEvolutionMode;
    actions?: ReactNode;
    indicateur: IndicatorMetadata;
    chartConfig: ChartConfig;
    aDesValeurs: boolean;
  }
>(({ mode, actions, indicateur, chartConfig, aDesValeurs }, ref) => {
  const modeImpression = mode === "impression";

  return (
    <section className="!p-10" ref={ref}>
      <div className="flex justify-between items-start gap-4 mb-2">
        <div>
          <h5 className="text-lg mb-0">
            Évolution de l'indicateur : {indicateur.nom} ({indicateur.id})
          </h5>
          <p className="fr-text--xs !text-dsfr-mention-grey">
            {`Mis à jour le : ${indicateur.dateDeMiseAJour} | Source : ${indicateur.source ?? "Non renseigné"}`}
          </p>
        </div>
        {actions}
      </div>

      {aDesValeurs ? (
        <div className="grid">
          <div className="min-h-80 overflow-hidden">
            <LineChart {...chartConfig} modeImpression={modeImpression} />
          </div>
        </div>
      ) : (
        <Badge>Non renseigné</Badge>
      )}

      {modeImpression ? (
        <LogoPilote className="border-t border-gray-300 p-4 mt-4" />
      ) : null}
    </section>
  );
});

BaseIndicateurEvolution.displayName = "BaseEvolution";
