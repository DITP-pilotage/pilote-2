import { useState } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { RouterOutputs } from "@/server/infrastructure/api/trpc/trpc.interface";
import { TypeCommentaireChantier } from "@/server/domain/chantier/commentaire/Commentaire.interface";

export default function useHistoriqueCommentaire({
  réformeId,
  territoireCode,
  type,
}: {
  réformeId: string;
  territoireCode: string;
  type: TypeCommentaireChantier;
}) {
  const [historique, setHistorique] =
    useState<RouterOutputs["commentaire"]["récupérerHistorique"]>();

  const { refetch: fetchHistorique } =
    api.commentaire.récupérerHistorique.useQuery(
      { réformeId, territoireCode, type },
      { enabled: false },
    );

  const récupérerHistorique = async () => {
    const { data } = await fetchHistorique();
    setHistorique(data);
  };

  return { historique, récupérerHistorique };
}
