import { z } from "zod";
import { typesDecisionStrategique } from "@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface";
import { extractVisibleText } from "@/client/utils/html/extractVisibleText";

export const LIMITE_CARACTERES_DECISION_STRATEGIQUE = 5000;

export const validationDecisionStrategiqueContexte = z.object({
  chantierId: z.string(),
  type: z.enum(typesDecisionStrategique),
});

export const validationDecisionStrategiqueFormulaire = z.object({
  contenu: z
    .string()
    .refine(
      (html) => extractVisibleText(html).trim().length >= 1,
      "La décision stratégique ne peut pas être vide",
    )
    .refine(
      (html) =>
        extractVisibleText(html).length <=
        LIMITE_CARACTERES_DECISION_STRATEGIQUE,
      `La limite de ${LIMITE_CARACTERES_DECISION_STRATEGIQUE} caractères a été dépassée`,
    ),
});

export const validationBrouillonDecisionStrategiqueAPublier = z.object({
  brouillonId: z.string(),
});

export const validationDecisionStrategiqueAModifier = z.object({
  decisionStrategiqueId: z.string(),
});
