import { useMemo } from 'react';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import météos from '@/client/constants/météos';
import NuancierMétéo from '@/client/constants/nuanciers/NuancierMétéo';
import { CartographieDonnéesMétéo } from './CartographieMétéo.interface';

export default function useCartographieMétéo(données: CartographieDonnéesMétéo) {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const nuancierMétéo = new NuancierMétéo();

  const légende = nuancierMétéo.nuances.map(({ remplissage, libellé, picto }) => ({
    libellé,
    remplissage,
    picto,
  }));

  const donnéesCartographie = useMemo(() => {
    let donnéesFormatées: CartographieDonnées = {};

    données.forEach(({ valeur, codeInsee }) => {
      const détailTerritoire = récupérerDétailsSurUnTerritoire(codeInsee, mailleSélectionnée);
  
      donnéesFormatées[codeInsee] = {
        valeurAffichée: météos[valeur],
        remplissage: nuancierMétéo.déterminerRemplissage(valeur).couleur,
        libellé: mailleSélectionnée === 'départementale' ? `${détailTerritoire?.codeInsee} - ${détailTerritoire?.nom}` : détailTerritoire?.nom ?? 'N/C',
      };
    });

    return donnéesFormatées;
  }, [données, mailleSélectionnée, récupérerDétailsSurUnTerritoire]);

  return {
    légende,
    donnéesCartographie,
  };
}
