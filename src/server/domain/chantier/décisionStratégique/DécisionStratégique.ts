import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import {
  DecisionStrategiqueV2,
  TypeDecisionStrategique,
} from "./DécisionStratégique.interface";

type ParamsCreation = {
  chantierId: string;
  type: TypeDecisionStrategique;
  contenu: string;
  auteurId: string;
  date: string;
};

type ParamsModification = {
  contenu: string;
  auteurModificationId: string;
  dateModification: string;
};

export function creerDecisionStrategiquePubliee(
  params: ParamsCreation,
): DecisionStrategiqueV2 {
  return {
    id: randomUUID(),
    chantierId: params.chantierId,
    type: params.type,
    contenu: params.contenu,
    statut: $Enums.statut_publication.PUBLIE,
    auteurCreationId: params.auteurId,
    dateCreation: params.date,
    auteurModificationId: params.auteurId,
    dateModification: params.date,
  };
}

export function creerDecisionStrategiqueBrouillon(
  params: ParamsCreation,
): DecisionStrategiqueV2 {
  return {
    ...creerDecisionStrategiquePubliee(params),
    id: randomUUID(),
    statut: $Enums.statut_publication.BROUILLON,
  };
}

export function modifierDecisionStrategique(
  existing: DecisionStrategiqueV2,
  params: ParamsModification,
): DecisionStrategiqueV2 {
  return {
    ...existing,
    contenu: params.contenu,
    auteurModificationId: params.auteurModificationId,
    dateModification: params.dateModification,
    statut: $Enums.statut_publication.PUBLIE,
  };
}

export function modifierDecisionStrategiqueBrouillon(
  existing: DecisionStrategiqueV2,
  params: ParamsModification,
): DecisionStrategiqueV2 {
  return {
    ...existing,
    contenu: params.contenu,
    auteurModificationId: params.auteurModificationId,
    dateModification: params.dateModification,
    statut: $Enums.statut_publication.BROUILLON,
  };
}
