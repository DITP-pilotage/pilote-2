import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import {
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import SynthèseDesRésultats from '@/server/domain/synthèseDesRésultats/SynthèseDesRésultats.interface';

export default function useHistoriqueDeLaSynthèseDesRésultats() {
  const router = useRouter();
  const chantierId = router.query.id as string; //TODO changer id pour chantierId
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const [historiqueDeLaSynthèseDesRésultats, setHistoriqueDeLaSynthèseDesRésultats] = useState<SynthèseDesRésultats[] | null>(null);

  useEffect(() => {
    setHistoriqueDeLaSynthèseDesRésultats(null);
  }, [chantierId, mailleAssociéeAuTerritoireSélectionné, territoireSélectionné.codeInsee]);

  const récupérerPublications = () => {
    // TODO A supprimer
    fetch(`/api/chantier/${chantierId}/historique-de-la-synthese-des-resultats?`
      + new URLSearchParams({
        maille: mailleAssociéeAuTerritoireSélectionné,
        codeInsee: territoireSélectionné.codeInsee,
      }))
      .then(réponse => {
        return réponse.json() as Promise<any>;
      })
      .then(données => {
        // TODO améliorer la gestion d'erreur
        setHistoriqueDeLaSynthèseDesRésultats(données.historiqueDeLaSynthèseDesRésultats ?? []);
      });
  };

  return {
    historiqueDeLaSynthèseDesRésultats,
    territoireSélectionné,
    récupérerPublications,
  };
}
