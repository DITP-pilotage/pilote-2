import { useEffect, useState } from 'react';
import { mailleSélectionnéeTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';
import { objectEntries } from '@/client/utils/objects/objects';
import Indicateur, { CartographieIndicateur } from '@/server/domain/indicateur/Indicateur.interface';
import { CartographieDonnéesValeurActuelle } from '@/components/_commons/Cartographie/CartographieValeurActuelle/CartographieValeurActuelle.interface';
import { CartographieDonnéesAvancement } from '@/components/_commons/Cartographie/CartographieAvancement/CartographieAvancement.interface';

const donnéesCartographiesVides = { '': { avancementAnnuel: null, valeurActuelle: null } };
const donnéesCartographieVides = [{ valeur: null, codeInsee: '' }];

export default function useIndicateurDétails(indicateurId: Indicateur['id'], futOuvert: boolean) {
  const mailleSélectionnée = mailleSélectionnéeTerritoiresStore();

  const [donnéesCartographies, setDonnéesCartographies] = useState<CartographieIndicateur>(donnéesCartographiesVides);
  const [donnéesCartographieAvancement, setDonnéesCartographieAvancement] = useState<CartographieDonnéesAvancement>(donnéesCartographieVides);
  const [donnéesCartographieValeurActuelle, setDonnéesCartographieValeurActuelle] = useState<CartographieDonnéesValeurActuelle>(donnéesCartographieVides);

  useEffect(() => {    
    if (futOuvert) {        
      fetch(`/api/indicateur/${indicateurId}/repartitions_geographiques?maille=${mailleSélectionnée}`)
        .then(réponse => réponse.json())
        .then(données => setDonnéesCartographies(données));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [futOuvert]);

  useEffect(() => {
    setDonnéesCartographieAvancement(
      objectEntries(donnéesCartographies).map(([codeInsee, valeurs]) => ({ valeur: valeurs.avancementAnnuel, codeInsee: codeInsee })),
    );
    setDonnéesCartographieValeurActuelle(
      objectEntries(donnéesCartographies).map(([codeInsee, valeurs]) => ({ valeur: valeurs.valeurActuelle, codeInsee: codeInsee })),
    );
  }, [donnéesCartographies]);

  return { 
    donnéesCartographieAvancement, 
    donnéesCartographieValeurActuelle,
  };
}
