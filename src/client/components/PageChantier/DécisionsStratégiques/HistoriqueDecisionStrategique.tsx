import { useState } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { HistoriquePublication } from "@/components/_commons/CommentairesNew/CommentaireSection/HistoriquePublication/HistoriquePublication";

export const HistoriqueDecisionStrategique = () => {
  const [open, setOpen] = useState(false);
  const { chantier } = pageChantier.useServerSidePropsContext();

  const { data: historique } =
    api.decisionStrategique.recupererHistorique.useQuery(
      { chantierId: chantier.id, type: "suiviDesDecisionsStrategiques" },
      { enabled: open },
    );

  return (
    <HistoriquePublication
      ariaLabel="Voir l'historique des décisions stratégiques"
      historique={historique}
      onOpenChange={setOpen}
      open={open}
      title="Historique - Décisions stratégiques"
    />
  );
};
