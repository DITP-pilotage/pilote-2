import { CartographieÉlémentsDeLégende } from '@/components/_commons/Cartographie/Légende/CartographieLégende.interface';

const REMPLISSAGE_PAR_DÉFAUT = '#bababa';

export const ÉLÉMENTS_LÉGENDE_VALEUR_ACTUELLE: CartographieÉlémentsDeLégende = {
  'DÉFAUT': {
    libellé: 'Territoire pour lequel la donnée n’est pas renseignée/disponible',
    remplissage: REMPLISSAGE_PAR_DÉFAUT,
  },
  'NON_APPLICABLE': {
    libellé: 'Territoire où le chantier prioritaire ne s’applique pas',
    remplissage: 'url(#hachures-gris-blanc)',
  },
};
