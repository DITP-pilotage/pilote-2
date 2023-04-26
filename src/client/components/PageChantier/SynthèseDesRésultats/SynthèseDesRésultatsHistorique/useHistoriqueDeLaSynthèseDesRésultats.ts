import {  useState } from 'react';
import {
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import api from '@/server/infrastructure/api/trpc/api';
import { RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export default function useHistoriqueDeLaSynthèseDesRésultats(chantierId: string) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const [historiqueDeLaSynthèseDesRésultats, setHistoriqueDeLaSynthèseDesRésultats] = useState<RouterOutputs['synthèseDesRésultats']['récupérerHistorique']>();
  
  const { refetch: fetchRécupérerHistoriqueSynthèseDesRésultats } = api.synthèseDesRésultats.récupérerHistorique.useQuery({
    chantierId,
    maille: mailleAssociéeAuTerritoireSélectionné,
    codeInsee: territoireSélectionné.codeInsee,
  }, {
    enabled: false,
  });

  const récupérerHistoriqueSynthèseDesRésultats = async () => {
    const { data: données } = await fetchRécupérerHistoriqueSynthèseDesRésultats();
    setHistoriqueDeLaSynthèseDesRésultats(données);
  };

  return {
    historiqueDeLaSynthèseDesRésultats,
    territoireSélectionné,
    récupérerHistoriqueSynthèseDesRésultats,
  };
}
