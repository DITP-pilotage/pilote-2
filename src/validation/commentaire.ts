import { z } from "zod";
import {
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { extractVisibleText } from "@/client/utils/html/extractVisibleText";

export const LIMITE_CARACTÈRES_COMMENTAIRE = 5000;

export const validationCommentaireContexte = z.object({
  chantierId: z.string(),
  territoireCode: z.string(),
  type: z.union([
    z.enum(typesCommentaireMailleNationale),
    z.enum(typesCommentaireMailleRégionaleOuDépartementale),
  ]),
});

export const validationCommentaireFormulaire = z.object({
  contenu: z
    .string()
    .refine(
      (html) => extractVisibleText(html).trim().length >= 1,
      "Le commentaire ne peut pas être vide",
    )
    .refine(
      (html) =>
        extractVisibleText(html).length <= LIMITE_CARACTÈRES_COMMENTAIRE,
      `La limite de ${LIMITE_CARACTÈRES_COMMENTAIRE} caractères a été dépassée`,
    ),
});

export const validationBrouillonCommentaireAPublier = z.object({
  brouillonId: z.string(),
});

export const validationCommentaireAModifier = z.object({
  commentaireId: z.string(),
});
