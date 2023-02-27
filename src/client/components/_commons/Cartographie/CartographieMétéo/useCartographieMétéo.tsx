import { useMemo } from 'react';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import météos from '@/client/constants/météos';
import { TerritoireGéographique } from '@/stores/useTerritoiresStore/useTerritoiresStore.interface';
import {
  CartographieÉlémentDeLégendeListe,
} from '@/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import { CartographieDonnéesMétéo } from './CartographieMétéo.interface';

const REMPLISSAGE_PAR_DÉFAUT = '#bababa';

const LÉGENDE: Record<string, CartographieÉlémentDeLégendeListe> = {
  'ORAGE': {
    libellé: météos.ORAGE,
    remplissage: '#B34000',
    picto: <PictoMétéo valeur="ORAGE" />,
  },
  'COUVERT': {
    libellé: météos.COUVERT,
    remplissage: '#95E257',
    picto: <PictoMétéo valeur="COUVERT" />,
  },
  'NUAGE': {
    libellé: météos.NUAGE,
    remplissage: '#EFCB3A',
    picto: <PictoMétéo valeur="NUAGE" />,
  },
  'SOLEIL': {
    libellé: météos.SOLEIL,
    remplissage: '#27A658',
    picto: <PictoMétéo valeur="SOLEIL" />,
  },
  'DÉFAUT': {
    libellé: 'Territoire pour lequel la météo n’est pas renseignée',
    remplissage: REMPLISSAGE_PAR_DÉFAUT,
  },
};

function déterminerRemplissage(valeur: Météo | null) {
  // eslint-disable-next-line unicorn/prefer-switch
  if (valeur === 'ORAGE') return LÉGENDE.ORAGE.remplissage;
  else if (valeur === 'COUVERT') return LÉGENDE.COUVERT.remplissage;
  else if (valeur === 'NUAGE') return LÉGENDE.NUAGE.remplissage;
  else if (valeur === 'SOLEIL') return LÉGENDE.SOLEIL.remplissage;
  else return LÉGENDE.DÉFAUT.remplissage;
}

function déterminerLibellé(territoireGéographique: TerritoireGéographique | undefined, estDépartement: boolean) {
  if (!territoireGéographique)
    return '-';

  return estDépartement
    ? `${territoireGéographique.codeInsee} - ${territoireGéographique.nom}`
    : territoireGéographique.nom;
}

export default function useCartographieMétéo(données: CartographieDonnéesMétéo) {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const légende = useMemo(() => (
    Object.values(LÉGENDE).map(({ remplissage, libellé, picto }) => ({
      libellé,
      remplissage,
      picto,
    }))
  ), []);

  const donnéesCartographie = useMemo(() => {
    let donnéesFormatées: CartographieDonnées = {};

    données.forEach(({ valeur, codeInsee }) => {
      const territoireGéographique = récupérerDétailsSurUnTerritoire(codeInsee, mailleSélectionnée);
  
      donnéesFormatées[codeInsee] = {
        valeurAffichée: météos[valeur],
        remplissage: déterminerRemplissage(valeur),
        libellé: déterminerLibellé(territoireGéographique, mailleSélectionnée === 'départementale'),
      };
    });

    return donnéesFormatées;
  }, [données, mailleSélectionnée, récupérerDétailsSurUnTerritoire]);

  return {
    légende,
    donnéesCartographie,
  };
}
