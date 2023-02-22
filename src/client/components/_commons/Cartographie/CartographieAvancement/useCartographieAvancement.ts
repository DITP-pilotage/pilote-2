import { useMemo } from 'react';
import nuancierPourcentage from '@/client/constants/nuanciers/nuancierPourcentage';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { remplissageParDéfaut } from '@/client/constants/nuanciers/nuancier';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import { CartographieDonnéesAvancement } from './CartographieAvancement.interface';

export default function useCartographieAvancement(données: CartographieDonnéesAvancement) {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const légende = nuancierPourcentage.map(({ remplissage, libellé }) => ({
    libellé,
    remplissage,
  }));

  const donnéesCartographie = useMemo(() => {
    let donnéesFormatées: CartographieDonnées = {};

    données.forEach(({ valeur, codeInsee }) => {
      const détailTerritoire = récupérerDétailsSurUnTerritoire(codeInsee, mailleSélectionnée);
  
      donnéesFormatées[codeInsee] = {
        valeurAffichée: valeur?.toFixed(0) + '%',
        remplissage: valeur === null ? remplissageParDéfaut.couleur : nuancierPourcentage.find(({ seuil }) => seuil !== null && seuil >= valeur)?.remplissage.couleur ?? remplissageParDéfaut.couleur,
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
