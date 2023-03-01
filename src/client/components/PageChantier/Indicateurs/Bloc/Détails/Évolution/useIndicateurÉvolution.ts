import { ChartOptions, ChartDataset, ChartData } from 'chart.js';
import { formaterDate } from '@/client/utils/date/date';
import IndicateurÉvolutionProps from './IndicateurÉvolution.interface';

export default function useIndicateurÉvolution(indicateurDétailsParTerritoires: IndicateurÉvolutionProps['indicateurDétailsParTerritoires']) {  
  let donnéesParTerritoire: ChartData<'line'>;

  const options: ChartOptions<'line'> = {
    responsive: true,
    scales: {
      x: {
        border: {
          dash: [2, 4],
        },
      },
      y: {
        border: {
          dash: [2, 4],
        },
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxHeight: 0,
          boxWidth: 30,
          padding: 40,
        },
      },
    },
  };

  if (indicateurDétailsParTerritoires.length === 1) {
    const détailsParTerritoire = indicateurDétailsParTerritoires[0];
    const labels = détailsParTerritoire.données.dateValeurs.map(date => formaterDate(date, 'mm/aaaa'));

    const cible: ChartDataset<'line'> = {
      label: 'Cible',
      data: Array.from({ length: labels.length }).map(() => détailsParTerritoire.données.valeurCible),
      borderColor: '#FC5D00',
      backgroundColor: 'transparent',
      borderDash: [10, 12],
      pointStyle: false,
      pointHitRadius: 0,
      pointRadius: 0,
    };
  
    const évolution: ChartDataset<'line'> = {
      label: détailsParTerritoire.territoire,
      data: détailsParTerritoire.données.valeurs,
      pointStyle: 'rect',
      pointRadius: 5,
      borderColor: '#0063CB',
      backgroundColor: '#0063CB',
    };
  
    donnéesParTerritoire = {
      labels: labels,
      datasets: détailsParTerritoire.données.valeurCible ? [évolution, cible] : [évolution],
    };
  } else {
    const labels = indicateurDétailsParTerritoires[0].données.dateValeurs.map(date => formaterDate(date, 'mm/aaaa'));
    
    const évolutions: ChartDataset<'line'>[] = indicateurDétailsParTerritoires.map(détailsParTerritoire => (
      {
        label: détailsParTerritoire.territoire,
        data: détailsParTerritoire.données.valeurs,
        pointStyle: 'rect',
        pointRadius: 5,
        borderColor: '#0063CB',
        backgroundColor: '#0063CB',
      }
    ));
      
    donnéesParTerritoire = {
      labels: labels,
      datasets: évolutions,
    };
  }

  return {
    donnéesParTerritoire,
    options,
  };
}
