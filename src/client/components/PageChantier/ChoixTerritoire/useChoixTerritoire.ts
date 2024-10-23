import { useMemo } from 'react';
import { territoiresTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import api from '@/server/infrastructure/api/trpc/api';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';

export default function useChoixTerritoire(chantierId: string, mailleSélectionnée: MailleInterne) {
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
        contenu: undefined,
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
