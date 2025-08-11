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
import IndicateurÉvolutionProps from "@/components/_commons/IndicateursChantier/Bloc/Détails/Évolution/IndicateurÉvolution.interface";
import IndicateurÉvolutionStyled from "./IndicateurÉvolution.styled";
import useIndicateurÉvolution from "./useIndicateurÉvolution";
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

const IndicateurÉvolution: FunctionComponent<IndicateurÉvolutionProps> = ({
  indicateurDétailsParTerritoires,
  indicateurDétailsParTerritoiresComparés,
  dateDeMiseAJourIndicateur,
  source,
  nouveauxGraphiquesSontActifs,
}) => {
  const tousLesIndicateursDetails = useMemo(() => {
    return [
      indicateurDétailsParTerritoires[0],
      ...indicateurDétailsParTerritoiresComparés,
    ];
  }, [
    indicateurDétailsParTerritoires,
    indicateurDétailsParTerritoiresComparés,
  ]);

  const { options, donnéesParTerritoire } = useIndicateurÉvolution(
    indicateurDétailsParTerritoires,
  );

  const {
    optionsNew,
    afficherLesCibles,
    setAfficherLesCibles,
    territoiresAAfficher,
    setTerritoiresAAfficher,
  } = useIndicateurEvolutionNew(tousLesIndicateursDetails);

  return (
    <IndicateurÉvolutionStyled>
      <Titre baliseHtml="h5" className="fr-text--lg fr-mb-0">
        Évolution de l'indicateur
      </Titre>
      <p className="fr-text--xs texte-gris">
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
                option={optionsNew}
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

export default IndicateurÉvolution;
