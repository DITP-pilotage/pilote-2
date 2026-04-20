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

export function publierBrouillonDecisionStrategique(
  existing: DecisionStrategiqueV2,
  params: ParamsModification,
): DecisionStrategiqueV2 {
  if (existing.statut !== $Enums.statut_publication.BROUILLON)
    throw new Error(
      `Statut invalide : attendu BROUILLON, reçu ${existing.statut}`,
    );

  return {
    ...existing,
    contenu: params.contenu,
    auteurModificationId: params.auteurModificationId,
    dateModification: params.dateModification,
    statut: $Enums.statut_publication.PUBLIE,
  };
}

export function modifierDecisionStrategiquePubliee(
  existing: DecisionStrategiqueV2,
  params: ParamsModification,
): DecisionStrategiqueV2 {
  if (existing.statut !== $Enums.statut_publication.PUBLIE)
    throw new Error(
      `Statut invalide : attendu PUBLIE, reçu ${existing.statut}`,
    );

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
  if (existing.statut !== $Enums.statut_publication.BROUILLON)
    throw new Error(
      `Statut invalide : attendu BROUILLON, reçu ${existing.statut}`,
    );

  return {
    ...existing,
    contenu: params.contenu,
    auteurModificationId: params.auteurModificationId,
    dateModification: params.dateModification,
    statut: $Enums.statut_publication.BROUILLON,
  };
}
