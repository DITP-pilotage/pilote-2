import { pictosMétéos } from '@/components/_commons/PictoMétéo/PictoMétéo';
import { couleurParDéfaut, NuancierMétéo } from './nuancier';

const nuancierMétéo: NuancierMétéo = [
  {
    valeur: 'ORAGE',
    libellé: pictosMétéos.ORAGE.nom,
    couleur : '#B34000',
    picto: pictosMétéos.ORAGE.picto,
  }, {
    valeur : 'COUVERT',
    libellé: pictosMétéos.COUVERT.nom,
    couleur : '#95E257',
    picto: pictosMétéos.COUVERT.picto,
  }, {
    valeur: 'NUAGE',
    libellé: pictosMétéos.NUAGE.nom,
    couleur: '#EFCB3A',
    picto: pictosMétéos.NUAGE.picto,
  },  {
    valeur: 'SOLEIL',
    libellé: pictosMétéos.SOLEIL.nom,
    couleur: '#27A658',
    picto: pictosMétéos.SOLEIL.picto,
  },
  {
    valeur: 'NON_RENSEIGNEE' || 'NON_NECESSAIRE',
    libellé: 'Territoire pour lequel la météo n’est pas renseignée',
    couleur: couleurParDéfaut,
  },
];

export default nuancierMétéo;
