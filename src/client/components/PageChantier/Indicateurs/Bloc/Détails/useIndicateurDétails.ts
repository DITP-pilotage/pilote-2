import { useEffect, useState } from 'react';
import { mailleSélectionnéeTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import { CartographieDonnéesValeurActuelle } from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle.interface';
import { CartographieDonnéesAvancement } from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement.interface';
import { DétailsIndicateurs } from '@/server/domain/indicateur/DétailsIndicateur.interface';

const donnéesCartographieVides = [{ valeur: null, codeInsee: '' }];

export default function useIndicateurDétails(indicateurId: Indicateur['id'], futOuvert: boolean) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const [donnéesCartographieAvancement, setDonnéesCartographieAvancement] = useState<CartographieDonnéesAvancement>(donnéesCartographieVides);
  const [donnéesCartographieValeurActuelle, setDonnéesCartographieValeurActuelle] = useState<CartographieDonnéesValeurActuelle>(donnéesCartographieVides);

  useEffect(() => {        
    if (futOuvert) {              
      fetch(`/api/indicateur/${indicateurId}?maille=${mailleSélectionnée}`)
        .then(réponse => réponse.json() as Promise<DétailsIndicateurs>)
        .then(détailsIndicateurs => {
          setDonnéesCartographieAvancement(
            objectEntries(détailsIndicateurs[indicateurId]).map(([codeInsee, détailsIndicateur]) => ({ valeur: détailsIndicateur.avancement.global, codeInsee: codeInsee })),
          );
          setDonnéesCartographieValeurActuelle(
            objectEntries(détailsIndicateurs[indicateurId]).map(([codeInsee, détailsIndicateur]) => ({ valeur: détailsIndicateur.valeurs[détailsIndicateur.valeurs.length - 1] ?? null, codeInsee: codeInsee })),
          );
        });
    }
  }, [futOuvert, indicateurId, mailleSélectionnée]);

  return { 
    donnéesCartographieAvancement, 
    donnéesCartographieValeurActuelle,
  };
}
