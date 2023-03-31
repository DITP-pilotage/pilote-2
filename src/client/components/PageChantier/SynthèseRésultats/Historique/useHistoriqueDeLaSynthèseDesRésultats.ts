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
  const [estModaleOuverte, setEstModaleOuverte] = useState(false);

  useEffect(() => {
    setHistoriqueDeLaSynthèseDesRésultats(null);
  }, [chantierId, mailleAssociéeAuTerritoireSélectionné, territoireSélectionné.codeInsee]);

  useEffect(() => {
    if (!chantierId || !estModaleOuverte)
      return;

    fetch(`/api/chantier/${chantierId}/historique-de-la-synthese-des-resultats?`
      + new URLSearchParams({
        maille: mailleAssociéeAuTerritoireSélectionné,
        codeInsee: territoireSélectionné.codeInsee,
      }))
      .then(réponse => {
        return réponse.json();
      })
      .then(données => {
        // TODO améliorer la gestion d'erreur
        setHistoriqueDeLaSynthèseDesRésultats(données.historiqueDeLaSynthèseDesRésultats ?? []);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estModaleOuverte]);

  return {
    historiqueDeLaSynthèseDesRésultats,
    territoireSélectionné,
    setEstModaleOuverte,
  };
}
