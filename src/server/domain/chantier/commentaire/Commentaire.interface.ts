import { $Enums } from "@prisma/client";

export type Commentaire = {
  id: string;
  contenu: string;
  date: string;
  auteur: string;
  type: TypeCommentaireChantier;
} | null;

export type CommentaireV2 = {
  id: string;
  chantierId: string;
  territoireCode: string;
  type: TypeCommentaireChantier;
  contenu: string;
  statut: $Enums.statut_publication;
  auteurCreationId: string;
  dateCreation: string;
  auteurModificationId: string;
  dateModification: string;
};

export type CommentaireAvecNomsAuteurs = CommentaireV2 & {
  auteurCreationNom: string;
  auteurModificationNom: string;
};

export const typesCommentaireMailleNationale = [
  "autresRésultatsObtenusNonCorrélésAuxIndicateurs",
  "risquesEtFreinsÀLever",
  "solutionsEtActionsÀVenir",
  "exemplesConcretsDeRéussite",
] as const;
export const typesCommentaireMailleRégionaleOuDépartementale = [
  "commentairesSurLesDonnées",
  "autresRésultatsObtenus",
] as const;

export type TypeCommentaireMailleNationale =
  (typeof typesCommentaireMailleNationale)[number];
export type TypeCommentaireMailleRégionaleOuDépartementale =
  (typeof typesCommentaireMailleRégionaleOuDépartementale)[number];
export type TypeCommentaireChantier =
  | TypeCommentaireMailleNationale
  | TypeCommentaireMailleRégionaleOuDépartementale;
