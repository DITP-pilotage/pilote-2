import { useMemo } from 'react';
import nuancierMétéo from '@/client/constants/nuanciers/nuancierMétéo';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { remplissageParDéfaut } from '@/client/constants/nuanciers/nuancier';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import météos from '@/client/constants/météos';
import { CartographieDonnéesMétéo } from './CartographieMétéo.interface';

export default function useCartographieMétéo(données: CartographieDonnéesMétéo) {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const légende = nuancierMétéo.map(({ remplissage, libellé, picto }) => ({ 
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
        remplissage: nuancierMétéo.find(({ valeur: valeurMétéo }) => valeurMétéo === valeur)?.remplissage.couleur ?? remplissageParDéfaut.couleur,
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
