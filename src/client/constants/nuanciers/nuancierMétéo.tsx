import { PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import { libellésMétéos } from '@/server/domain/chantier/Météo.interface';
import { couleurParDéfaut, NuancierMétéo } from './nuancier';

const nuancierMétéo: NuancierMétéo = [
  {
    valeur: 'ORAGE',
    libellé: libellésMétéos.ORAGE,
    couleur: '#B34000',
    picto: <PictoMétéo valeur="ORAGE" />,
  },
  {
    valeur : 'COUVERT',
    libellé: libellésMétéos.COUVERT,
    couleur : '#95E257',
    picto: <PictoMétéo valeur="COUVERT" />,
  }, {
    valeur: 'NUAGE',
    libellé: libellésMétéos.NUAGE,
    couleur: '#EFCB3A',
    picto: <PictoMétéo valeur="NUAGE" />,
  },  {
    valeur: 'SOLEIL',
    libellé: libellésMétéos.SOLEIL,
    couleur: '#27A658',
    picto: <PictoMétéo valeur="SOLEIL" />,
  },
  {
    valeur: 'NON_RENSEIGNEE',
    libellé: 'Territoire pour lequel la météo n’est pas renseignée',
    couleur: couleurParDéfaut,
  },
];

export default nuancierMétéo;
