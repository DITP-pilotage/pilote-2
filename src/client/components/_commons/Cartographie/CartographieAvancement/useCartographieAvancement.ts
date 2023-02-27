import { useMemo } from 'react';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import NuancierPourcentage from '@/client/constants/nuanciers/NuancierPourcentage';
import { CartographieDonnéesAvancement } from './CartographieAvancement.interface';

export default function useCartographieAvancement(données: CartographieDonnéesAvancement) {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const nuancierPourcentage = useMemo(() => new NuancierPourcentage(), []);

  const légende = nuancierPourcentage.nuances.map(({ remplissage, libellé }) => ({
    libellé,
    remplissage,
  }));

  const donnéesCartographie = useMemo(() => {
    let donnéesFormatées: CartographieDonnées = {};

    données.forEach(({ valeur, codeInsee }) => {
      const détailTerritoire = récupérerDétailsSurUnTerritoire(codeInsee, mailleSélectionnée);
  
      donnéesFormatées[codeInsee] = {
        valeurAffichée: valeur === null ? 'Non renseigné' : valeur.toFixed(0) + '%',
        remplissage: nuancierPourcentage.déterminerRemplissage(valeur),
        libellé: mailleSélectionnée === 'départementale' ? `${détailTerritoire?.codeInsee} - ${détailTerritoire?.nom}` : détailTerritoire?.nom ?? 'N/C',
      };
    });

    return donnéesFormatées;
  }, [données, mailleSélectionnée, nuancierPourcentage, récupérerDétailsSurUnTerritoire]);

  return {
    légende,
    donnéesCartographie,
  };
}
