import { useState } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { HistoriquePublication } from "@/components/PageChantier/PublicationV2/Historique/HistoriquePublication";
import { TypeObjectif } from "@/server/domain/chantier/objectif/Objectif.interface";
import { libellésTypesObjectif } from "@/client/constants/libellésObjectif";

export const HistoriqueObjectif = ({ type }: { type: TypeObjectif }) => {
  const [open, setOpen] = useState(false);
  const { chantier } = pageChantier.useServerSidePropsContext();

  const { data: historique } = api.objectif.recupererHistorique.useQuery(
    { chantierId: chantier.id, type },
    { enabled: open },
  );

  return (
    <HistoriquePublication
      ariaLabel={`Voir l'historique des objectifs - ${libellésTypesObjectif[type]}`}
      historique={historique}
      onOpenChange={setOpen}
      open={open}
      title={`Historique - ${libellésTypesObjectif[type]}`}
    />
  );
};
