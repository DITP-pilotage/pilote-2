import { useMemo } from 'react';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import { TerritoireGéographique } from '@/stores/useTerritoiresStore/useTerritoiresStore.interface';
import { CartographieÉlémentDeLégendeListe } from '@/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe.interface';
import { libellésMétéos, Météo } from '@/server/domain/météo/Météo.interface';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import { CartographieDonnéesMétéo } from './CartographieMétéo.interface';

const REMPLISSAGE_PAR_DÉFAUT = '#bababa';

const LÉGENDE: Record<string, CartographieÉlémentDeLégendeListe> = {
  'ORAGE': {
    libellé: libellésMétéos.ORAGE,
    remplissage: '#B34000',
    picto: <MétéoPicto météo="ORAGE" />,
  },
  'COUVERT': {
    libellé: libellésMétéos.COUVERT,
    remplissage: '#95E257',
    picto: <MétéoPicto météo="COUVERT" />,
  },
  'NUAGE': {
    libellé: libellésMétéos.NUAGE,
    remplissage: '#EFCB3A',
    picto: <MétéoPicto météo="NUAGE" />,
  },
  'SOLEIL': {
    libellé: libellésMétéos.SOLEIL,
    remplissage: '#27A658',
    picto: <MétéoPicto météo="SOLEIL" />,
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
        valeurAffichée: libellésMétéos[valeur],
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
