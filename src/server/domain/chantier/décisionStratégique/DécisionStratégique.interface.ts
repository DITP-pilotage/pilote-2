export const typesDecisionStrategique = [
  "suiviDesDécisionsStratégiques",
] as const;
export type TypeDecisionStrategique = (typeof typesDecisionStrategique)[number];

export type DécisionStratégique = {
  id: string;
  contenu: string;
  date: string;
  auteur: string;
  type: TypeDecisionStrategique;
} | null;

import { $Enums } from "@prisma/client";

export type DecisionStrategiqueV2 = {
  id: string;
  chantierId: string;
  type: TypeDecisionStrategique;
  contenu: string;
  statut: $Enums.statut_publication;
  auteurCreationId: string;
  auteurModificationId: string;
  dateCreation: string;
  dateModification: string;
};

export type DecisionStrategiqueV2AvecNomsAuteurs = DecisionStrategiqueV2 & {
  auteurModificationNom: string;
};
