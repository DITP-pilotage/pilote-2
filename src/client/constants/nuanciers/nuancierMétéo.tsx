import { PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import météos from '@/client/constants/météos';
import { remplissageParDéfaut, NuancierMétéo } from './nuancier';

const nuancierMétéo: NuancierMétéo = [
  {
    valeur: 'ORAGE',
    libellé: météos.ORAGE,
    remplissage: {
      type: 'COULEUR',
      couleur: '#B34000',
    },
    picto: <PictoMétéo valeur="ORAGE" />,
  }, {
    valeur : 'COUVERT',
    libellé: météos.COUVERT,
    remplissage: {
      type: 'COULEUR',
      couleur: '#95E257',
    },
    picto: <PictoMétéo valeur="COUVERT" />,
  }, {
    valeur: 'NUAGE',
    libellé: météos.NUAGE,
    remplissage: {
      type: 'COULEUR',
      couleur: '#EFCB3A',
    },
    picto: <PictoMétéo valeur="NUAGE" />,
  }, {
    valeur: 'SOLEIL',
    libellé: météos.SOLEIL,
    remplissage: {
      type: 'COULEUR',
      couleur: '#27A658',
    },
    picto: <PictoMétéo valeur="SOLEIL" />,
  }, {
    valeur: 'NON_RENSEIGNEE',
    libellé: 'Territoire pour lequel la météo n’est pas renseignée',
    remplissage: remplissageParDéfaut,
  },
];

export default nuancierMétéo;
