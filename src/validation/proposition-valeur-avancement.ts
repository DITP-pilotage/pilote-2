import { z } from "zod";

export const validationPropositionValeurAvancement = z.object({
  valeurAvancement: z
    .string()
    .refine(
      (value) => new RegExp(/^-?\d+$|^-?\d+(,|\.)\d+$/).test(value),
      "Le champ doit être un nombre",
    ),
  motifProposition: z
    .string()
    .refine(
      (value) => value && new RegExp(/^\w.*$/).test(value),
      "Veuillez saisir un motif de proposition",
    ),
  dateValeurAvancement: z.string(),
  sourceDonneeEtMethodeCalcul: z.string(),
  indicId: z.string(),
  territoireCode: z.string(),
});

export const validationSuppressionValeurAvancement = z.object({
  auteurModification: z.string(),
  indicId: z.string(),
  territoireCode: z.string(),
});

export const validationSuppressionValeurAvancementV2 = z.object({
  auteurModification: z.string(),
  indicId: z.string(),
  territoireCode: z.string(),
  dateValeurAvancement: z.string(),
});

export const validationAccepterPropositionValeurAvancement = z.object({
  indicId: z.string(),
  territoireCode: z.string(),
  dateValeurAvancement: z.string(),
  motif: z.string().trim(),
});

export const validationRefuserPropositionValeurAvancement = z.object({
  indicId: z.string(),
  territoireCode: z.string(),
  dateValeurAvancement: z.string(),
  motif: z.string().trim().min(1, "Veuillez saisir un motif de refus"),
});

export const validationAccuserReceptionPropositionValeurAvancement = z.object({
  indicId: z.string(),
  territoireCode: z.string(),
  dateValeurAvancement: z.string(),
  motif: z
    .string()
    .trim()
    .min(1, "Veuillez saisir un motif d'accusé de réception"),
});
