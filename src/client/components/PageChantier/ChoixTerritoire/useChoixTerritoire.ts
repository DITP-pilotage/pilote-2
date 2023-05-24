import { useMemo } from 'react';
import { mailleSélectionnéeTerritoiresStore, territoiresTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import api from '@/server/infrastructure/api/trpc/api';

export default function useChoixTerritoire(chantierId: string) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();
  const territoires = territoiresTerritoiresStore();

  const { data: chantier } = api.chantier.récupérer.useQuery(
    {
      chantierId,
    },
  );

  const donnéesCartographie = useMemo(() => {
    const donnéesFormatées: CartographieDonnées = {};

    territoires.filter(territoire => territoire.maille === mailleSélectionnée).forEach(territoire => {

      donnéesFormatées[territoire.codeInsee] = {
        valeurAffichée: '',
        remplissage: '#bababa',
        libellé: territoire.nomAffiché,
      };
    });

    return donnéesFormatées;
  }, [mailleSélectionnée, territoires]);

  return {
    chantier: chantier ?? null,
    donnéesCartographie,
  };
}
