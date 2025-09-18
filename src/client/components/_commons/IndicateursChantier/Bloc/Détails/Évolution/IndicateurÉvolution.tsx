import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { FunctionComponent, useMemo } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { useTerritoireSelectionne } from "@/components/PageChantier/PageChantierServerSideContext";
import { IndicateurDétailsParTerritoire } from "@/client/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface";
import IndicateurÉvolutionStyled from "./IndicateurÉvolution.styled";
import { useIndicateurÉvolution } from "./useIndicateurÉvolution";
import useIndicateurEvolutionNew from "./useIndicateurEvolutionNew";
import LineChart from "./LineChart/LineChart";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

type IndicateurÉvolutionProps = {
  indicateurDétailsParTerritoiresComparés: IndicateurDétailsParTerritoire[];
  dateDeMiseAJourIndicateur: string | null;
  nouveauxGraphiquesSontActifs: boolean;
};

export const IndicateurÉvolution: FunctionComponent<
  IndicateurÉvolutionProps
> = ({
  indicateurDétailsParTerritoiresComparés,
  dateDeMiseAJourIndicateur,
  nouveauxGraphiquesSontActifs,
}) => {
  const {
    detailIndicateurDuTerritoire,
    indicateur: { source },
  } = useBlocIndicateurContext();
  const detailTerritoireSelectionne = useTerritoireSelectionne();

  const tousLesIndicateursDetails = useMemo(() => {
    return [
      {
        données: detailIndicateurDuTerritoire,
        territoireNom: detailTerritoireSelectionne.nom,
        territoireCode: detailTerritoireSelectionne.code,
      },
      ...indicateurDétailsParTerritoiresComparés,
    ];
  }, [
    detailIndicateurDuTerritoire,
    detailTerritoireSelectionne,
    indicateurDétailsParTerritoiresComparés,
  ]);

  const { options, donnéesParTerritoire } = useIndicateurÉvolution();

  const {
    optionsNew,
    afficherLesCibles,
    setAfficherLesCibles,
    territoiresAAfficher,
    setTerritoiresAAfficher,
    periodeSelectionnee,
    changerLaPeriodeSelectionnee,
    periodesSelectionnablesZoom,
  } = useIndicateurEvolutionNew(tousLesIndicateursDetails);

  return (
    <IndicateurÉvolutionStyled>
      <Titre baliseHtml="h5" className="fr-text--lg fr-mb-0">
        Évolution de l'indicateur
      </Titre>
      <p className="fr-text--xs !text-dsfr-mention-grey">
        {`Mis à jour le : ${dateDeMiseAJourIndicateur} | Source : ${source ?? "Non renseigné"}`}
      </p>
      {donnéesParTerritoire.datasets.some(
        (dataset) => dataset.data.length > 0,
      ) ? (
        <div className="graphique-bloc">
          <div className="graphique-conteneur">
            {nouveauxGraphiquesSontActifs ? (
              <LineChart
                afficherLesCibles={afficherLesCibles}
                changerLaPeriodeSelectionnee={changerLaPeriodeSelectionnee}
                option={optionsNew}
                periodeSelectionnee={periodeSelectionnee}
                periodesSelectionnablesZoom={periodesSelectionnablesZoom}
                setAfficherLesCibles={setAfficherLesCibles}
                setTerritoiresAAfficher={setTerritoiresAAfficher}
                territoiresAAfficher={territoiresAAfficher}
                tousLesIndicateursDetails={tousLesIndicateursDetails}
              />
            ) : (
              <Line data={donnéesParTerritoire} options={options} />
            )}
          </div>
        </div>
      ) : (
        <p className="fr-badge fr-badge--no-icon">NON RENSEIGNÉ</p>
      )}
    </IndicateurÉvolutionStyled>
  );
};
