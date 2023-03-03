import { ChartOptions, ChartDataset, ChartData } from 'chart.js';
import { formaterDate } from '@/client/utils/date/date';
import IndicateurÉvolutionProps from './IndicateurÉvolution.interface';

export default function useIndicateurÉvolution(indicateurDétailsParTerritoires: IndicateurÉvolutionProps['indicateurDétailsParTerritoires']) {  
  let donnéesParTerritoire: ChartData<'line'>;
  const estEnSélectionMultiple = () => indicateurDétailsParTerritoires.length > 1;
  const indicateurDétailsPourUnTerritoire = indicateurDétailsParTerritoires[0];

  const options: ChartOptions<'line'> = {
    responsive: true,
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

  const évolutions: ChartDataset<'line'>[] = indicateurDétailsParTerritoires.map(détailsParTerritoire => ({
    label: détailsParTerritoire.territoireNom,
    data: détailsParTerritoire.données.valeurs,
    pointStyle: 'rect',
    pointRadius: 5,
    borderColor: '#0063CB',
    backgroundColor: '#0063CB',
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
