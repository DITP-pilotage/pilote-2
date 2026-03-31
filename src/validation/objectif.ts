import { z } from "zod";
import { typesObjectif } from "@/server/domain/chantier/objectif/Objectif.interface";
import { extractVisibleText } from "@/client/utils/html/extractVisibleText";

export const LIMITE_CARACTERES_OBJECTIF = 5000;

export const validationObjectifContexte = z.object({
  chantierId: z.string(),
  type: z.enum(typesObjectif),
});

export const validationObjectifFormulaire = z.object({
  contenu: z
    .string()
    .refine(
      (html) => extractVisibleText(html).trim().length >= 1,
      "L'objectif ne peut pas être vide",
    )
    .refine(
      (html) => extractVisibleText(html).length <= LIMITE_CARACTERES_OBJECTIF,
      `La limite de ${LIMITE_CARACTERES_OBJECTIF} caractères a été dépassée`,
    ),
});

export const validationBrouillonObjectifAPublier = z.object({
  brouillonId: z.string(),
});

export const validationObjectifAModifier = z.object({
  objectifId: z.string(),
});
