import {  useState } from 'react';
import api from '@/server/infrastructure/api/trpc/api';
import { RouterOutputs } from '@/server/infrastructure/api/trpc/trpc.interface';

export default function useHistoriqueDeLaSynthèseDesRésultats(chantierId: string, territoireCode: string) {
  const [historiqueDeLaSynthèseDesRésultats, setHistoriqueDeLaSynthèseDesRésultats] = useState<RouterOutputs['synthèseDesRésultats']['récupérerHistorique']>();
  
  const { refetch: fetchRécupérerHistoriqueSynthèseDesRésultats } = api.synthèseDesRésultats.récupérerHistorique.useQuery({
    réformeId: chantierId,
    territoireCode,
    typeDeRéforme: 'chantier',
  }, {
    enabled: false,
  });

  const récupérerHistoriqueSynthèseDesRésultats = async () => {
    const { data: données } = await fetchRécupérerHistoriqueSynthèseDesRésultats();
    setHistoriqueDeLaSynthèseDesRésultats(données);
  };

  return {
    historiqueDeLaSynthèseDesRésultats,
    récupérerHistoriqueSynthèseDesRésultats,
  };
}
