import { useState } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { RouterOutputs } from "@/server/infrastructure/api/trpc/trpc.interface";
import {
  validationPublicationContexte,
  zodValidateurEntitéType,
} from "@/validation/publication";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import PublicationHistoriqueProps from "./PublicationHistorique.interface";

export default function usePublicationHistorique(
  type: PublicationHistoriqueProps["type"],
  entité: PublicationHistoriqueProps["entité"],
  réformeId: PublicationHistoriqueProps["réformeId"],
  maille: PublicationHistoriqueProps["maille"],
  territoireCode: string,
) {
  const typeDeRéforme = "chantier";

  const territoireSelectionne = récupérerDétailsSurUnTerritoire(territoireCode);

  const [publications, setPublications] =
    useState<RouterOutputs["publication"]["récupérerHistorique"]>();

  const inputs = validationPublicationContexte
    .and(zodValidateurEntitéType)
    .parse({
      réformeId,
      territoireCode,
      type,
      entité,
      typeDeRéforme,
    });

  const { refetch: fetchRécupérerPublications } =
    api.publication.récupérerHistorique.useQuery(inputs, {
      enabled: false,
    });

  const récupérerPublications = async () => {
    const { data: données } = await fetchRécupérerPublications();
    setPublications(données);
  };

  return {
    publications,
    nomTerritoire:
      maille === "nationale" ? "France" : territoireSelectionne.nom,
    récupérerPublications,
  };
}
