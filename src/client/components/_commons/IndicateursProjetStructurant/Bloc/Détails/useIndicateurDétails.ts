import { useEffect, useState } from 'react';
import { mailleSélectionnéeTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { CartographieDonnéesValeurActuelle } from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle.interface';
import { CartographieDonnéesAvancement } from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement.interface';
import {
  DétailsIndicateurMailles,
} from '@/server/domain/indicateur/DétailsIndicateur.interface';
import api from '@/server/infrastructure/api/trpc/api';
import { TypeDeRéforme } from '@/client/stores/useTypeDeRéformeStore/useTypedeRéformeStore.interface';

export default function useIndicateurDétails(indicateurId: Indicateur['id'], futOuvert: boolean, typeDeRéforme: TypeDeRéforme) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const [donnéesCartographieAvancement, setDonnéesCartographieAvancement] = useState<CartographieDonnéesAvancement | null>(null);
  const [donnéesCartographieValeurActuelle, setDonnéesCartographieValeurActuelle] = useState<CartographieDonnéesValeurActuelle | null>(null);
  const [donnéesCartographieAvancementTerritorialisées, setDonnéesCartographieAvancementTerritorialisées] = useState<boolean>(false);
  const [donnéesCartographieValeurActuelleTerritorialisées, setDonnéesCartographieValeurActuelleTerritorialisées] = useState<boolean>(false);

  function aDeLaDonnéeTerritoriale(donnéesCartographie: CartographieDonnéesAvancement | CartographieDonnéesValeurActuelle | null): boolean {
    if (donnéesCartographie) {
      for (const d of donnéesCartographie) {
        if (d.valeur !== null) {
          return true;
        }
      }
    }
    return false;
  }
  

  const { refetch: fetchDétailsIndicateur  } = api.indicateur.récupererDétailsIndicateur.useQuery(
    { indicateurId },
    {
      refetchOnWindowFocus: false,
      enabled: false,
      onSuccess: (data: DétailsIndicateurMailles) => {
        setDonnéesCartographieAvancement(
          objectEntries(data[mailleSélectionnée]).map(([codeInsee, détailsIndicateur]) => ({ valeur: détailsIndicateur.avancement.global, codeInsee: codeInsee, estApplicable: détailsIndicateur.est_applicable })),
        );
        setDonnéesCartographieValeurActuelle(
          objectEntries(data[mailleSélectionnée]).map(([codeInsee, détailsIndicateur]) => ({ valeur: détailsIndicateur.valeurs[détailsIndicateur.valeurs.length - 1] ?? null, codeInsee: codeInsee, estApplicable: détailsIndicateur.est_applicable })),
        );
      },
    },
  );

  useEffect(() => {
    if (futOuvert && typeDeRéforme === 'chantier') {
      fetchDétailsIndicateur();
    }
  }, [fetchDétailsIndicateur, futOuvert, indicateurId, mailleSélectionnée, typeDeRéforme]);

  useEffect(() => {
    setDonnéesCartographieAvancementTerritorialisées(aDeLaDonnéeTerritoriale(donnéesCartographieAvancement));
  }, [donnéesCartographieAvancement]);

  useEffect(() => {
    setDonnéesCartographieValeurActuelleTerritorialisées(aDeLaDonnéeTerritoriale(donnéesCartographieValeurActuelle));
  }, [donnéesCartographieValeurActuelle]);

  return {
    donnéesCartographieAvancement,
    donnéesCartographieValeurActuelle,
    donnéesCartographieAvancementTerritorialisées,
    donnéesCartographieValeurActuelleTerritorialisées,
  };
}
