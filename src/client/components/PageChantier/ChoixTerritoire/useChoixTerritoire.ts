import { useMemo } from 'react';
import { territoiresTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import { MailleInterne } from '@/server/chantiers/domain/Maille';

export default function useChoixTerritoire(mailleSélectionnée: MailleInterne) {
  const territoires = territoiresTerritoiresStore();

  const donnéesCartographie = useMemo(() => {
    const donnéesFormatées: CartographieDonnées = {};

    territoires.filter(territoire => territoire.maille === mailleSélectionnée).forEach(territoire => {

      donnéesFormatées[territoire.code] = {
        contenu: undefined,
        remplissage: '#bababa',
        libellé: territoire.nomAffiché,
        estApplicable: true,
      };
    });

    return donnéesFormatées;
  }, [mailleSélectionnée, territoires]);

  return {
    donnéesCartographie,
  };
}
