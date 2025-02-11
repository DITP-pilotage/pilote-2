import { CartographieÉlémentsDeLégende } from '@/components/_commons/Cartographie/Légende/CartographieLégende.interface';

export const ELEMENTS_LEGENDE_PROPOSITION_VALEUR_CHANTIERS: CartographieÉlémentsDeLégende = {
  'DEFAUT': {
    libellé: 'Aucun indicateur ne fait l\'object d\'une proposition',
    remplissage: '#FEF5E8',
  },
  'PROPOSITION': {
    libellé: 'Un ou plusieurs indicateurs font l\'objet d\'une proposition',
    remplissage: '#FCC63A',
  },
  'PROPOSITION_AVEC_PONDERATION': {
    libellé: 'La ou les propositions concernant au moins un indicateur participant au taux d\'avancement',
    remplissage: '#C3992A',
  },
  'NON_APPLICABLE': {
    libellé: 'Territoire où le chantier prioritaire ne s’applique pas',
    remplissage: 'url(#hachures-gris-blanc)',
  },
};
