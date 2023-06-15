import {  useState } from 'react';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import api from '@/server/infrastructure/api/trpc/api';
import { RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';
import { typeDeRéformeSélectionnéeStore } from '@/client/stores/useTypeDeRéformeStore/useTypeDeRéformeStore';

export default function useHistoriqueDeLaSynthèseDesRésultats(chantierId: string) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const typeDeRéforme = typeDeRéformeSélectionnéeStore();
  const [historiqueDeLaSynthèseDesRésultats, setHistoriqueDeLaSynthèseDesRésultats] = useState<RouterOutputs['synthèseDesRésultats']['récupérerHistorique']>();
  
  const { refetch: fetchRécupérerHistoriqueSynthèseDesRésultats } = api.synthèseDesRésultats.récupérerHistorique.useQuery({
    réformeId: chantierId,
    territoireCode: territoireSélectionné!.code,
    typeDeRéforme,
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
