import { CartographieÉlémentsDeLégende } from '@/components/_commons/Cartographie/Légende/CartographieLégende.interface';

const REMPLISSAGE_PAR_DÉFAUT = '#bababa';

export const ÉLÉMENTS_LÉGENDE_AVANCEMENT_CHANTIERS: CartographieÉlémentsDeLégende = {
  '=0': {
    libellé: '0%',
    remplissage: 'url(#hachures-gris-blanc)',
  },
  '0-10': {
    libellé: '0-10%',
    remplissage: '#e6e6f4',
  },
  '10-20': {
    libellé: '10-20%',
    remplissage: '#d7d7ee',
  },
  '20-30': {
    libellé: '20-30%',
    remplissage: '#cbcbe8',
  },
  '30-40': {
    libellé: '30-40%',
    remplissage: '#bbbbe2',
  },
  '40-50': {
    libellé: '40-50%',
    remplissage: '#aeaedc',
  },
  '50-60': {
    libellé: '50-60%',
    remplissage: '#9a9ad4',
  },
  '60-70': {
    libellé: '60-70%',
    remplissage: '#8686cb',
  },
  '70-80': {
    libellé: '70-80%',
    remplissage: '#6666bd',
  },
  '80-90': {
    libellé: '80-90%',
    remplissage: '#4040ad',
  },
  '90-100': {
    libellé: '90-100%',
    remplissage: '#000091',
  },
  'DÉFAUT': {
    libellé: 'Territoire pour lequel la donnée n’est pas disponible',
    remplissage: REMPLISSAGE_PAR_DÉFAUT,
  },
};

export const ÉLÉMENTS_LÉGENDE_AVANCEMENT_PROJETS_STRUCTURANTS: CartographieÉlémentsDeLégende = {
  '=0': {
    libellé: '0%',
    remplissage: 'url(#hachures-gris-blanc)',
  },
  '0-10': {
    libellé: '0-10%',
    remplissage: '#DDB5B5',
  },
  '10-20': {
    libellé: '10-20%',
    remplissage: '#D7AAA9',
  },
  '20-30': {
    libellé: '20-30%',
    remplissage: '#D29F9E',
  },
  '30-40': {
    libellé: '30-40%',
    remplissage: '#CD9493',
  },
  '40-50': {
    libellé: '40-50%',
    remplissage: '#C88988',
  },
  '50-60': {
    libellé: '50-60%',
    remplissage: '#C37E7D',
  },
  '60-70': {
    libellé: '60-70%',
    remplissage: '#BE7272',
  },
  '70-80': {
    libellé: '70-80%',
    remplissage: '#B86766',
  },
  '80-90': {
    libellé: '80-90%',
    remplissage: '#B35C5B',
  },
  '90-100': {
    libellé: '90-100%',
    remplissage: '#AE5150',
  },
  '=100': {
    libellé: '100%',
    remplissage: '#A94645',
  },
  'DÉFAUT': {
    libellé: 'Territoire pour lequel la donnée n’est pas disponible',
    remplissage: REMPLISSAGE_PAR_DÉFAUT,
  },
};
