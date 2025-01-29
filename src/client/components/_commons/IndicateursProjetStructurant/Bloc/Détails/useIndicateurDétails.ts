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

export default function useIndicateurDétails(indicateurId: Indicateur['id'], futOuvert: boolean, typeDeRéforme: TypeDeRéforme, jalon: number) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const [donnéesCartographieAvancement, setDonnéesCartographieAvancement] = useState<CartographieDonnéesAvancement | null>(null);
  const [donnéesCartographieValeurActuelle, setDonnéesCartographieValeurActuelle] = useState<CartographieDonnéesValeurActuelle | null>(null);
  const [donnéesCartographieAvancementTerritorialisées, setDonnéesCartographieAvancementTerritorialisées] = useState<boolean>(false);
  const [donnéesCartographieValeurActuelleTerritorialisées, setDonnéesCartographieValeurActuelleTerritorialisées] = useState<boolean>(false);

  function aDeLaDonnéeTerritoriale(donnéesCartographie: CartographieDonnéesAvancement | CartographieDonnéesValeurActuelle | null): boolean {
    if (donnéesCartographie) {
      for (const donneeCartographie of donnéesCartographie) {
        if (donneeCartographie.valeur !== null) {
          return true;
        }
      }
    }
    return false;
  }
  

  const { refetch: fetchDétailsIndicateur  } = api.indicateur.récupererDétailsIndicateur.useQuery(
    { indicateurId, jalon },
    {
      refetchOnWindowFocus: false,
      enabled: false,
      onSuccess: (data: DétailsIndicateurMailles) => {
        setDonnéesCartographieAvancement(
          objectEntries(data[mailleSélectionnée]).map(([territoireCode, détailsIndicateur]) => ({ valeur: détailsIndicateur.avancement.global, valeurAnnuelle: détailsIndicateur.avancement.annuel, territoireCode: territoireCode, estApplicable: détailsIndicateur.est_applicable })),
        );
        setDonnéesCartographieValeurActuelle(
          objectEntries(data[mailleSélectionnée]).map(([territoireCode, détailsIndicateur]) => ({ valeur: détailsIndicateur.valeurActuelle ?? null, valeurCible: détailsIndicateur.valeurCible ?? null, valeurCibleAnnuelle: détailsIndicateur.valeurCibleAnnuelle ?? null, territoireCode: territoireCode, estApplicable: détailsIndicateur.est_applicable })),
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
