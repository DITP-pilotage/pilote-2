import { CartographieÉlémentsDeLégende } from '@/components/_commons/Cartographie/Légende/CartographieLégende.interface';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import { libellésMétéos } from '@/server/domain/météo/Météo.interface';

const REMPLISSAGE_PAR_DÉFAUT = '#bababa';

export const ÉLÉMENTS_LÉGENDE_MÉTÉO_CHANTIERS: CartographieÉlémentsDeLégende = {
  'ORAGE': {
    libellé: libellésMétéos.ORAGE,
    remplissage: '#B34000',
    picto: <MétéoPicto météo='ORAGE' />,
  },
  'COUVERT': {
    libellé: libellésMétéos.COUVERT,
    remplissage: '#95E257',
    picto: <MétéoPicto météo='COUVERT' />,
  },
  'NUAGE': {
    libellé: libellésMétéos.NUAGE,
    remplissage: '#EFCB3A',
    picto: <MétéoPicto météo='NUAGE' />,
  },
  'SOLEIL': {
    libellé: libellésMétéos.SOLEIL,
    remplissage: '#27A658',
    picto: <MétéoPicto météo='SOLEIL' />,
  },
  'DÉFAUT': {
    libellé: 'Territoire pour lequel la météo n’est pas renseignée',
    remplissage: REMPLISSAGE_PAR_DÉFAUT,
  },
  'NON_APPLICABLE': {
    libellé: 'Territoire où le chantier prioritaire ne s’applique pas',
    remplissage: 'url(#hachures-gris-blanc)',
  },
};
