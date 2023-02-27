import { useMemo } from 'react';
import { actionsTerritoiresStore, mailleSélectionnéeTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import {
  CartographieDonnéesValeurActuelle,
} from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle.interface';
import { valeurMaximum, valeurMinimum } from '@/client/utils/statistiques/statistiques';
import NuancierDégradé from '@/client/constants/nuanciers/NuancierDégradé';

export default function useCartographieValeurActuelle({ libelléUnité, données }: CartographieDonnéesValeurActuelle) {
  const { récupérerDétailsSurUnTerritoire } = actionsTerritoiresStore();
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const valeurMin = valeurMinimum(données.map(donnée => donnée.valeur)) ?? 0;
  const valeurMax = valeurMaximum(données.map(donnée => donnée.valeur)) ?? 0;

  const nuancierDégradé = useMemo(() => (
    new NuancierDégradé(valeurMin, valeurMax)
  ), [valeurMax, valeurMin]);

  const donnéesCartographie = useMemo(() => {
    let donnéesFormatées: CartographieDonnées = {};

    données.forEach(({ valeur, codeInsee }) => {
      const détailTerritoire = récupérerDétailsSurUnTerritoire(codeInsee, mailleSélectionnée);
      donnéesFormatées[codeInsee] = {
        valeurAffichée: valeur === null ? 'Non renseigné' : String(valeur),
        remplissage: nuancierDégradé.déterminerRemplissage(valeur),
        libellé: mailleSélectionnée === 'départementale' ? `${détailTerritoire?.codeInsee} - ${détailTerritoire?.nom}` : détailTerritoire?.nom ?? 'N/C',
      };
    });

    return donnéesFormatées;
  }, [données, mailleSélectionnée, nuancierDégradé, récupérerDétailsSurUnTerritoire]);

  return {
    légende: {
      libelléUnité,
      valeurMin: String(valeurMin),
      valeurMax: String(valeurMax),
      couleurMin: nuancierDégradé.couleurDépart,
      couleurMax: nuancierDégradé.couleurArrivé,
    },
    donnéesCartographie,
  };
}
