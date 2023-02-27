import { ReactNode } from 'react';
import { PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import météos from '@/client/constants/météos';
import { Météo } from '@/server/domain/météo/Météo.interface';
import Nuancier, { remplissageParDéfaut, NuancierRemplissage } from './Nuancier';

type NuanceMétéo = {
  valeur: Météo,
  libellé: string,
  remplissage: NuancierRemplissage,
  picto?: ReactNode,
};

class NuancierMétéo implements Nuancier {

  readonly nuances: NuanceMétéo[] = [
    {
      valeur: 'ORAGE',
      libellé: météos.ORAGE,
      remplissage: '#B34000',
      picto: <PictoMétéo valeur="ORAGE" />,
    }, {
      valeur : 'COUVERT',
      libellé: météos.COUVERT,
      remplissage: '#95E257',
      picto: <PictoMétéo valeur="COUVERT" />,
    }, {
      valeur: 'NUAGE',
      libellé: météos.NUAGE,
      remplissage: '#EFCB3A',
      picto: <PictoMétéo valeur="NUAGE" />,
    }, {
      valeur: 'SOLEIL',
      libellé: météos.SOLEIL,
      remplissage: '#27A658',
      picto: <PictoMétéo valeur="SOLEIL" />,
    }, {
      valeur: 'NON_RENSEIGNEE',
      libellé: 'Territoire pour lequel la météo n’est pas renseignée',
      remplissage: remplissageParDéfaut,
    },
  ];

  déterminerRemplissage(valeur: Météo): NuancierRemplissage {
    return this.nuances
      .find(
        ({ valeur: valeurMétéo }) => valeurMétéo === valeur,
      )?.remplissage
      ?? remplissageParDéfaut;
  }
}

export default NuancierMétéo;
