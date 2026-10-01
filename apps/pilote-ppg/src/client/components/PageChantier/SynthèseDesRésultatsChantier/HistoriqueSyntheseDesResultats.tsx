import { useState } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import {
  pageChantier,
  useTerritoireSelectionne,
} from "@/components/PageChantier/PageChantierServerSideContext";
import { HistoriquePublication } from "@/components/PageChantier/Publication/Historique/HistoriquePublication";
import { MeteoSyntheseDesResultats } from "./MeteoSyntheseDesResultats";

export const HistoriqueSyntheseDesResultats = () => {
  const [open, setOpen] = useState(false);
  const { chantier, territoireCode } = pageChantier.useServerSidePropsContext();
  const territoireSélectionné = useTerritoireSelectionne();

  const { data: historique } =
    api.synthèseDesRésultats.récupérerHistorique.useQuery(
      { chantierId: chantier.id, territoireCode },
      { enabled: open },
    );

  return (
    <HistoriquePublication
      annexe={(synthese) => (
        <MeteoSyntheseDesResultats meteo={synthese.meteo} />
      )}
      historique={historique}
      onOpenChange={setOpen}
      open={open}
      sousTitre={territoireSélectionné.nomAffiché}
      title="Historique - Synthèse des résultats"
    />
  );
};
