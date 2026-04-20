import { z } from "zod";

export const LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION = 500;
export const validationPropositionValeurAvancement = z.object({
  valeurAvancement: z
    .string()
    .refine(
      (value) => new RegExp(/^-?\d+$|^-?\d+([,.])\d+$/).test(value),
      "Le champ doit être un nombre",
    ),
  motifProposition: z
    .string()
    .max(
      LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION,
      "La limite maximale de 500 caractères a été dépassée",
    )
    .refine(
      (value) => value && new RegExp(/^\w.*$/).test(value),
      "Veuillez saisir un motif de proposition",
    ),
  dateValeurAvancement: z.string(),
  sourceDonneeEtMethodeCalcul: z
    .string()
    .max(
      LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION,
      "La limite maximale de 500 caractères a été dépassée",
    ),
  indicId: z.string(),
  territoireCode: z.string(),
});

export const validationSuppressionValeurAvancementV2 = z.object({
  indicId: z.string(),
  territoireCode: z.string(),
  dateValeurAvancement: z.string(),
  motif: z.string().trim().min(1, "Veuillez saisir un motif de suppression"),
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
  motif: z.string().trim(),
});

export const validationSuppressionPropositionValeurAvancement = z.object({
  motifSuppression: z
    .string()
    .trim()
    .min(1, "Le motif de suppression est obligatoire")
    .max(
      LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION,
      "La limite de 500 caractères a été dépassée",
    ),
});

export const validationAccepterAvecModificationPropositionValeurAvancement =
  z.object({
    indicId: z.string(),
    territoireCode: z.string(),
    dateValeurAvancement: z.string(),
    valeur: z.number(),
    motif: z.string().trim(),
  });

export const validationAccuserReceptionPropostionValeurAvancement = z.object({
  indicId: z.string(),
  territoireCode: z.string(),
  dateValeurAvancement: z.string(),
  motif: z
    .string()
    .trim()
    .max(
      LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION,
      "La limite de 500 caractères a été dépassée",
    ),
});
