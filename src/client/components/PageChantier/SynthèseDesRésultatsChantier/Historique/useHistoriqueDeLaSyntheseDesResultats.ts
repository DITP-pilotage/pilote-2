import { useState } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { RouterOutputs } from "@/server/infrastructure/api/trpc/trpc.interface";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";

export default function useHistoriqueDeLaSyntheseDesResultats() {
  const { chantier, territoireCode } = pageChantier.useServerSidePropsContext();
  const [
    historiqueDeLaSynthèseDesRésultats,
    setHistoriqueDeLaSynthèseDesRésultats,
  ] = useState<RouterOutputs["synthèseDesRésultats"]["récupérerHistorique"]>();

  const { refetch: fetchRécupérerHistoriqueSynthèseDesRésultats } =
    api.synthèseDesRésultats.récupérerHistorique.useQuery(
      {
        réformeId: chantier.id,
        territoireCode,
        typeDeRéforme: "chantier",
      },
      {
        enabled: false,
      },
    );

  const récupérerHistoriqueSynthèseDesRésultats = async () => {
    const { data: données } =
      await fetchRécupérerHistoriqueSynthèseDesRésultats();
    setHistoriqueDeLaSynthèseDesRésultats(données);
  };

  return {
    historiqueDeLaSynthèseDesRésultats,
    récupérerHistoriqueSynthèseDesRésultats,
  };
}
