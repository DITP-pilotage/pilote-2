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
import { TypeDeRéforme } from '@/components/PageAccueil/SélecteurTypeDeRéforme/SélecteurTypeDeRéforme.interface';

export default function useIndicateurDétails(indicateurId: Indicateur['id'], futOuvert: boolean, typeDeRéforme: TypeDeRéforme) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const [donnéesCartographieAvancement, setDonnéesCartographieAvancement] = useState<CartographieDonnéesAvancement | null>(null);
  const [donnéesCartographieValeurActuelle, setDonnéesCartographieValeurActuelle] = useState<CartographieDonnéesValeurActuelle | null>(null);
  
  const { refetch: fetchDétailsIndicateur  } = api.indicateur.récupererDétailsIndicateur.useQuery(
    { indicateurId },
    {
      refetchOnWindowFocus: false,
      enabled: false,
      onSuccess: (data: DétailsIndicateurMailles) => {
        setDonnéesCartographieAvancement(
          objectEntries(data[mailleSélectionnée]).map(([codeInsee, détailsIndicateur]) => ({ valeur: détailsIndicateur.avancement.global, codeInsee: codeInsee })),
        );
        setDonnéesCartographieValeurActuelle(
          objectEntries(data[mailleSélectionnée]).map(([codeInsee, détailsIndicateur]) => ({ valeur: détailsIndicateur.valeurs[détailsIndicateur.valeurs.length - 1] ?? null, codeInsee: codeInsee })),
        );
      },
    },
  );

  useEffect(() => {
    if (futOuvert && typeDeRéforme === 'chantier') {
      fetchDétailsIndicateur();
    }
  }, [fetchDétailsIndicateur, futOuvert, indicateurId, mailleSélectionnée, typeDeRéforme]);

  return {
    donnéesCartographieAvancement,
    donnéesCartographieValeurActuelle,
  };
}
