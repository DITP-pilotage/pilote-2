import { z } from "zod";
import {
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";

export const LIMITE_CARACTÈRES_COMMENTAIRE = 5000;

export const validationCommentaireContexte = z.object({
  réformeId: z.string(),
  territoireCode: z.string(),
  type: z.union([
    z.enum(typesCommentaireMailleNationale),
    z.enum(typesCommentaireMailleRégionaleOuDépartementale),
  ]),
});

export const validationCommentaireFormulaire = z.object({
  contenu: z
    .string()
    .max(
      LIMITE_CARACTÈRES_COMMENTAIRE,
      `La limite de ${LIMITE_CARACTÈRES_COMMENTAIRE} caractères a été dépassée`,
    )
    .min(1, "Le commentaire ne peut pas être vide"),
});

export const validationCommentaire = z.object({
  id: z.string(),
  chantierId: z.string(),
  territoireCode: z.string(),
  type: z.union([
    z.enum(typesCommentaireMailleNationale),
    z.enum(typesCommentaireMailleRégionaleOuDépartementale),
  ]),
  contenu: z.string(),
  statut: z.enum(["PUBLIE", "BROUILLON"]),
  auteurCreationId: z.string(),
  dateCreation: z.string(),
  auteurModificationId: z.string(),
  dateModification: z.string(),
});

export const validationBrouillonCommentaireAPublier = z.object({
  brouillon: validationCommentaire,
});

export const validationCommentaireAModifier = z.object({
  commentaireAModifier: validationCommentaire,
});
