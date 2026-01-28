import { forwardRef } from "react";
import { Line } from "react-chartjs-2";
import Link from "next/link";
import Titre from "@/client/components/_commons/Titre/Titre";
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

        <div className="border-t border-gray-300 flex items-center gap-10 p-4 mt-4">
          <p className="fr-logo">Gouvernement</p>
          <div>
            <Link href="/" title="Retour à l'accueil du site">
              <p className="fr-header__service-title mb-0">PILOTE</p>
            </Link>
            <p className="fr-header__service-tagline fr-text--sm mb-0">
              Piloter l'action publique par les résultats
            </p>
          </div>
        </div>
      </IndicateurÉvolutionStyled>
    );
  },
);

BaseIndicateurEvolution.displayName = "BaseEvolution";
