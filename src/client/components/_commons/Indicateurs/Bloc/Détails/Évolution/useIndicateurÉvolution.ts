import { ChartOptions, ChartDataset, ChartData } from 'chart.js';
import { formaterDate } from '@/client/utils/date/date';
import { générerCouleursAléatoiresEntreDeuxCouleurs } from '@/client/utils/couleur/couleur';
import IndicateurÉvolutionProps from './IndicateurÉvolution.interface';

export default function useIndicateurÉvolution(indicateurDétailsParTerritoires: IndicateurÉvolutionProps['indicateurDétailsParTerritoires']) {
  let donnéesParTerritoire: ChartData<'line'>;
  const estEnSélectionMultiple = () => indicateurDétailsParTerritoires.length > 1;
  const indicateurDétailsPourUnTerritoire = indicateurDétailsParTerritoires[0];
  const couleurs = générerCouleursAléatoiresEntreDeuxCouleurs('#8bcdb1', '#083a25', indicateurDétailsParTerritoires.length);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { border: { dash: [2, 4] } },
      y: { border: { dash: [2, 4] }, beginAtZero: true },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { boxHeight: 0, boxWidth: 30, padding: 40 },
      },
    },
  };
  
  const libellés = indicateurDétailsPourUnTerritoire.données.dateValeurs.map(date => formaterDate(date, 'mm/aaaa'));

  const évolutions: ChartDataset<'line'>[] = indicateurDétailsParTerritoires.map((détailsParTerritoire, index) => ({
    label: détailsParTerritoire.territoireNom,
    data: détailsParTerritoire.données.valeurs,
    pointStyle: 'rect',
    pointRadius: 5,
    borderColor: couleurs[index],
    backgroundColor: couleurs[index],
  }));

  if (estEnSélectionMultiple()) {
    donnéesParTerritoire = {
      labels: libellés,
      datasets: évolutions,
    };
  } else {    
    const valeurCible: ChartDataset<'line'> = {
      label: 'Cible',
      data: Array.from({ length: libellés.length }).map(() => indicateurDétailsPourUnTerritoire.données.valeurCible),
      borderColor: '#FC5D00',
      backgroundColor: 'transparent',
      borderDash: [10, 12],
      pointStyle: false,
      pointHitRadius: 0,
      pointRadius: 0,
    };
  
    donnéesParTerritoire = {
      labels: libellés,
      datasets: indicateurDétailsPourUnTerritoire.données.valeurCible ? [évolutions[0], valeurCible] : [évolutions[0]],
    };
  }

  return {
    donnéesParTerritoire,
    options,
  };
}
