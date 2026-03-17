import { useState } from "react";
import { TypeCommentaireChantier } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import api from "@/server/infrastructure/api/trpc/api";
import { pageChantier } from "@/components/PageChantier/PageChantierServerSideContext";
import { HistoriquePublication } from "@/components/PageChantier/Publication/Historique/HistoriquePublication";

const HistoriqueCommentaire = ({ type }: { type: TypeCommentaireChantier }) => {
  const [open, setOpen] = useState(false);
  const { chantier, territoireCode } = pageChantier.useServerSidePropsContext();

  const { data: historique } = api.commentaire.recupererHistorique.useQuery(
    { chantierId: chantier.id, territoireCode, type },
    { enabled: open },
  );

  return (
    <HistoriquePublication
      ariaLabel={`Voir l'histoire des commentaires du type ${type}`}
      historique={historique}
      onOpenChange={setOpen}
      open={open}
      title="Historique - Commentaires"
    />
  );
};

export default HistoriqueCommentaire;
