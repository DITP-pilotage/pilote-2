import { useEffect, useState } from 'react';
import { objectEntries } from '@/client/utils/objects/objects';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import {
  CartographieDonnéesValeurActuelle,
} from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle.interface';
import {
  CartographieDonnéesAvancement,
} from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement.interface';
import { DétailsIndicateurMailles } from '@/server/domain/indicateur/DétailsIndicateur.interface';
import api from '@/server/infrastructure/api/trpc/api';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';

export default function useIndicateurDétails(indicateurId: Indicateur['id'], futOuvert: boolean, mailleSelectionnee: MailleInterne) {
  const [donnéesCartographieAvancement, setDonnéesCartographieAvancement] = useState<CartographieDonnéesAvancement | null>(null);
  const [donnéesCartographieValeurActuelle, setDonnéesCartographieValeurActuelle] = useState<CartographieDonnéesValeurActuelle | null>(null);
  const [donnéesCartographieAvancementTerritorialisées, setDonnéesCartographieAvancementTerritorialisées] = useState<boolean>(false);
  const [donnéesCartographieValeurActuelleTerritorialisées, setDonnéesCartographieValeurActuelleTerritorialisées] = useState<boolean>(false);

  function aDeLaDonnéeTerritoriale(donnéesCartographie: CartographieDonnéesAvancement | CartographieDonnéesValeurActuelle | null): boolean {
    return (donnéesCartographie || []).some(donnéesCarto => donnéesCarto.valeur !== null);
  }

  const { refetch: fetchDétailsIndicateur  } = api.indicateur.récupererDétailsIndicateur.useQuery(
    { indicateurId },
    {
      refetchOnWindowFocus: false,
      enabled: false,
      onSuccess: (data: DétailsIndicateurMailles) => {
        setDonnéesCartographieAvancement(
          objectEntries(data[mailleSelectionnee]).map(([codeInsee, détailsIndicateur]) => ({ valeur: détailsIndicateur.avancement.global, codeInsee: codeInsee, estApplicable: détailsIndicateur.est_applicable })),
        );
        setDonnéesCartographieValeurActuelle(
          objectEntries(data[mailleSelectionnee]).map(([codeInsee, détailsIndicateur]) => ({ valeur: détailsIndicateur.valeurs[détailsIndicateur.valeurs.length - 1] ?? null, codeInsee: codeInsee, estApplicable: détailsIndicateur.est_applicable })),
        );
      },
    },
  );

  useEffect(() => {
    if (futOuvert) {
      fetchDétailsIndicateur();
    }
  }, [fetchDétailsIndicateur, futOuvert, indicateurId, mailleSelectionnee]);

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
