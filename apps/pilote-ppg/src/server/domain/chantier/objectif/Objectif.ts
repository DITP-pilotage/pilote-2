import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { ObjectifV2, TypeObjectif } from "./Objectif.interface";

type ParamsCreation = {
  chantierId: string;
  type: TypeObjectif;
  contenu: string;
  auteurId: string;
  date: string;
};

type ParamsModification = {
  contenu: string;
  auteurModificationId: string;
  dateModification: string;
};

export function creerObjectifPublie(params: ParamsCreation): ObjectifV2 {
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

export function creerObjectifBrouillon(params: ParamsCreation): ObjectifV2 {
  return {
    ...creerObjectifPublie(params),
    id: randomUUID(),
    statut: $Enums.statut_publication.BROUILLON,
  };
}

export function publierBrouillonObjectif(
  existing: ObjectifV2,
  params: ParamsModification,
): ObjectifV2 {
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

export function modifierObjectifPublie(
  existing: ObjectifV2,
  params: ParamsModification,
): ObjectifV2 {
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

export function modifierObjectifBrouillon(
  existing: ObjectifV2,
  params: ParamsModification,
): ObjectifV2 {
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
