import { useMemo } from 'react';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import nuancierDégradé from '@/client/constants/nuanciers/nuancierDégradé';
import {
  CartographieDonnéesValeurActuelle,
} from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle.interface';
import { valeurMaximum, valeurMinimum } from '@/client/utils/statistiques/statistiques';

export default function useCartographieValeurActuelle({ libelléUnité, données }: CartographieDonnéesValeurActuelle) {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const valeurMin = valeurMinimum(données.map(donnée => donnée.valeur)) ?? 0;
  const valeurMax = valeurMaximum(données.map(donnée => donnée.valeur)) ?? 0;

  const légende = {
    libelléUnité,
    valeurMin,
    valeurMax,
    couleurMin: nuancierDégradé.couleurDépart,
    couleurMax: nuancierDégradé.couleurArrivé,
  };

  const donnéesCartographie = useMemo(() => {
    let donnéesFormatées: CartographieDonnées = {};

    données.forEach(({ valeur, codeInsee }) => {
      const détailTerritoire = récupérerDétailsSurUnTerritoire(codeInsee, mailleSélectionnée);
      donnéesFormatées[codeInsee] = {
        valeurAffichée: valeur === null ? 'Non renseigné' : String(valeur),
        remplissage: nuancierDégradé.récupérerRemplissage(valeurMin, valeurMax, valeur).couleur,
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
