import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import Titre from '@/components/_commons/Titre/Titre';
import IndicateurÉvolutionProps from '@/components/PageChantier/Indicateurs/Bloc/Détails/Évolution/IndicateurÉvolution.interface';
import useIndicateurÉvolution from './useIndicateurÉvolution';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

export default function IndicateurÉvolution({ indicateurDétailsParTerritoires }: IndicateurÉvolutionProps) {
  const { options, donnéesParTerritoire } = useIndicateurÉvolution(indicateurDétailsParTerritoires);

  return (
    <section>
      <Titre
        baliseHtml='h5'
        className='fr-text--lg fr-mb-0'
      >
        Évolution de l&apos;indicateur
      </Titre>
      <p className="fr-text--xs texte-gris">
        Mis à jour le : Non renseigné | Source : Non renseigné
      </p>
      <Line
        data={donnéesParTerritoire}
        options={options}
      />
    </section>
  );
}
