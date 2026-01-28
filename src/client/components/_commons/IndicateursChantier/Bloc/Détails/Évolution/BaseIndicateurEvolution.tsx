import { forwardRef } from "react";
import { Line } from "react-chartjs-2";
import Titre from "@/client/components/_commons/Titre/Titre";
import { LogoPilote } from "@/components/_commons/LogoPilote";
import LineChart from "./LineChart/LineChart";
import IndicateurÉvolutionStyled from "./IndicateurÉvolution.styled";
import type { BaseEvolutionProps } from "./types";

export const BaseIndicateurEvolution = forwardRef<
  HTMLElement,
  BaseEvolutionProps
>(
  (
    {
      mode,
      actions,
      indicateur,
      chartConfig,
      donnéesParTerritoire,
      optionsLegacy,
      nouveauxGraphiquesSontActifs,
    },
    ref,
  ) => {
    const modeImpression = mode === "impression";
    const hasData = donnéesParTerritoire.datasets.some(
      (dataset) => dataset.data.length > 0,
    );

    return (
      <IndicateurÉvolutionStyled className="!p-10" ref={ref}>
        <div className="flex justify-between items-start gap-4 mb-2">
          <div>
            <Titre baliseHtml="h5" className="fr-text--lg fr-mb-0">
              Évolution de l'indicateur : {indicateur.nom} ({indicateur.id})
            </Titre>
            <p className="fr-text--xs !text-dsfr-mention-grey">
              {`Mis à jour le : ${indicateur.dateDeMiseAJour} | Source : ${indicateur.source ?? "Non renseigné"}`}
            </p>
          </div>
          {actions}
        </div>

        {hasData ? (
          <div className="graphique-bloc">
            <div className="graphique-conteneur">
              {nouveauxGraphiquesSontActifs ? (
                <LineChart {...chartConfig} modeImpression={modeImpression} />
              ) : (
                <Line data={donnéesParTerritoire} options={optionsLegacy} />
              )}
            </div>
          </div>
        ) : (
          <p className="fr-badge fr-badge--no-icon">NON RENSEIGNÉ</p>
        )}

        {modeImpression ? (
          <LogoPilote className="border-t border-gray-300 p-4 mt-4" />
        ) : null}
      </IndicateurÉvolutionStyled>
    );
  },
);

BaseIndicateurEvolution.displayName = "BaseEvolution";
