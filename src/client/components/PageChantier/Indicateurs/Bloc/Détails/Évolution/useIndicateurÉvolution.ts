import { ChartOptions, ChartDataset, ChartData } from 'chart.js';
import IndicateurÉvolutionProps from './IndicateurÉvolution.interface';

export default function useIndicateurÉvolution(indicateur: IndicateurÉvolutionProps['indicateur']) {
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

  const labels = indicateur.mailles.nationale.FR.evolutionDateValeurActuelle;

  const cible: ChartDataset<'line'> = {
    label: 'Cible',
    data: Array.from({ length: labels.length }).map(() => indicateur.mailles.nationale.FR.valeurCible),
    borderColor: '#FC5D00',
    backgroundColor: 'transparent',
    borderDash: [10, 12],
    pointStyle: false,
    pointHitRadius: 0,
    pointRadius: 0,
  };

  const évolution: ChartDataset<'line'> = {
    label: 'National',
    data: indicateur.mailles.nationale.FR.evolutionValeurActuelle,
    pointStyle: 'rect',
    pointRadius: 5,
    borderColor: '#0063CB',
    backgroundColor: '#0063CB',
  };

  const données: ChartData<'line'> = {
    labels: labels,
    datasets: indicateur.mailles.nationale.FR.valeurCible ? [évolution, cible] : [évolution],
  };
  
  return {
    données,
    options,
  };
}
