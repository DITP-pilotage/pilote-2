export const typesDecisionStrategique = [
  "suiviDesDecisionsStrategiques",
] as const;
export type TypeDecisionStrategique = (typeof typesDecisionStrategique)[number];

export type DécisionStratégique = {
  id: string;
  contenu: string;
  contenuHtml?: string | null;
  date: string;
  auteur: string;
  type: TypeDecisionStrategique;
} | null;

import { $Enums } from "@prisma/client";

export type DecisionStrategiqueV2 = {
  id: string;
  chantierId: string;
  contenu: string;
  contenuHtml?: string | null;
  statut: $Enums.statut_publication;
  auteurCreationId: string;
  auteurModificationId: string;
  dateCreation: string;
  dateModification: string;
};

export type DecisionStrategiqueV2AvecNomsAuteurs = DecisionStrategiqueV2 & {
  auteurCreationNom: string;
  auteurModificationNom: string;
};
