import { useEffect, useState } from 'react';
import { mailleSélectionnéeTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { CartographieDonnéesValeurActuelle } from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle.interface';
import { CartographieDonnéesAvancement } from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement.interface';
import {
  DétailsIndicateurTerritoire,
} from '@/server/domain/indicateur/DétailsIndicateur.interface';
import api from '@/server/infrastructure/api/trpc/api';

export default function useIndicateurDétails(indicateurId: Indicateur['id'], futOuvert: boolean) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();


  const [donnéesCartographieAvancement, setDonnéesCartographieAvancement] = useState<CartographieDonnéesAvancement | null>(null);
  const [donnéesCartographieValeurActuelle, setDonnéesCartographieValeurActuelle] = useState<CartographieDonnéesValeurActuelle | null>(null);
  const { refetch: fetchDétailsIndicateur } = api.indicateur.récupererDétailsIndicateur.useQuery(
    { indicateurId },
    { refetchOnWindowFocus: false, enabled: false,
      onSuccess: (data: DétailsIndicateurTerritoire) => {
        setDonnéesCartographieAvancement(
          objectEntries(data[mailleSélectionnée]).map(([codeInsee, détailsIndicateur]) => ({ valeur: détailsIndicateur.avancement.global, codeInsee: codeInsee })),
        );
        setDonnéesCartographieValeurActuelle(
          objectEntries(data[mailleSélectionnée]).map(([codeInsee, détailsIndicateur]) => ({ valeur: détailsIndicateur.valeurs[détailsIndicateur.valeurs.length - 1] ?? null, codeInsee: codeInsee })),
        );
      } },
  );
  useEffect(() => {
    if (futOuvert) {
      fetchDétailsIndicateur();
    }
  }, [fetchDétailsIndicateur, futOuvert, indicateurId, mailleSélectionnée]);

  return {
    donnéesCartographieAvancement,
    donnéesCartographieValeurActuelle,
  };
}
