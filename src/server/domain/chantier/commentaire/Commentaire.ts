import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import {
  CommentaireV2,
  TypeCommentaireChantier,
} from "./Commentaire.interface";

type ParamsCreation = {
  chantierId: string;
  territoireCode: string;
  type: TypeCommentaireChantier;
  contenu: string;
  auteurId: string;
  date: string;
};

type ParamsModification = {
  contenu: string;
  auteurModificationId: string;
  dateModification: string;
};

export function creerCommentairePublie(params: ParamsCreation): CommentaireV2 {
  return {
    id: randomUUID(),
    chantierId: params.chantierId,
    territoireCode: params.territoireCode,
    type: params.type,
    contenu: params.contenu,
    statut: $Enums.statut_publication.PUBLIE,
    auteurCreationId: params.auteurId,
    dateCreation: params.date,
    auteurModificationId: params.auteurId,
    dateModification: params.date,
  };
}

export function creerCommentaireBrouillon(
  params: ParamsCreation,
): CommentaireV2 {
  return {
    ...creerCommentairePublie(params),
    id: randomUUID(),
    statut: $Enums.statut_publication.BROUILLON,
  };
}

export function modifierCommentaire(
  existing: CommentaireV2,
  params: ParamsModification,
): CommentaireV2 {
  return {
    ...existing,
    contenu: params.contenu,
    auteurModificationId: params.auteurModificationId,
    dateModification: params.dateModification,
    statut: $Enums.statut_publication.PUBLIE,
  };
}

export function modifierCommentaireBrouillon(
  existing: CommentaireV2,
  params: ParamsModification,
): CommentaireV2 {
  return {
    ...existing,
    contenu: params.contenu,
    auteurModificationId: params.auteurModificationId,
    dateModification: params.dateModification,
    statut: $Enums.statut_publication.BROUILLON,
  };
}
