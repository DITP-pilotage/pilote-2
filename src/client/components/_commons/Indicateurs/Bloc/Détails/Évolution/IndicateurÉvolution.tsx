import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateurÉvolutionProps from '@/components/_commons/Indicateurs/Bloc/Détails/Évolution/IndicateurÉvolution.interface';
import IndicateurÉvolutionStyled from './IndicateurÉvolution.styled';
import useIndicateurÉvolution from './useIndicateurÉvolution';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

export default function IndicateurÉvolution({ indicateurDétailsParTerritoires, dateDeMiseAJourIndicateur }: IndicateurÉvolutionProps) {
  const { options, donnéesParTerritoire } = useIndicateurÉvolution(indicateurDétailsParTerritoires);

  return (
    <IndicateurÉvolutionStyled>
      <Titre
        baliseHtml='h5'
        className='fr-text--lg fr-mb-0'
      >
        Évolution de l&apos;indicateur
      </Titre>
      <p className="fr-text--xs texte-gris">
        {`Mis à jour le : ${dateDeMiseAJourIndicateur} | Source : Non renseigné`}
      </p>
      {
        donnéesParTerritoire.datasets.some(dataset => dataset.data.length > 0) ? (
          <div className="graphique-bloc">
            <div className="graphique-conteneur">
              <Line
                data={donnéesParTerritoire}
                options={options}
              />
            </div>
          </div>
        ) : (
          <p className="fr-badge fr-badge--no-icon">
            NON RENSEIGNÉ
          </p>
        )
      }
    </IndicateurÉvolutionStyled>
  );
}
