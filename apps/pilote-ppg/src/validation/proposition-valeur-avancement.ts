import { z } from "zod";

export const LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION = 500;

const MESSAGE_LIMITE_CARACTERES_DEPASSEE =
  "La limite maximale de 500 caractères a été dépassée";

// La limite s'applique au texte saisi, comme le compteur affiché sous le champ.
const texteDocumentation = () =>
  z
    .string()
    .max(
      LIMITE_CARACTERES_DOCUMENTATION_PROPOSITION,
      MESSAGE_LIMITE_CARACTERES_DEPASSEE,
    )
    .trim();

export const champsPropositionValeurAvancement = z.object({
  valeurAvancement: z
    .string()
    .refine(
      (value) => new RegExp(/^-?\d+$|^-?\d+([,.])\d+$/).test(value),
      "Le champ doit être un nombre",
    ),
  motifProposition: texteDocumentation().min(
    1,
    "Veuillez saisir un motif de proposition",
  ),
  sourceDonneeEtMethodeCalcul: texteDocumentation().min(
    1,
    "Veuillez renseigner la source des données et la méthode de calcul",
  ),
  indicId: z.string(),
  territoireCode: z.string(),
});

export const validationPropositionValeurAvancement =
  champsPropositionValeurAvancement.extend({
    dateValeurAvancement: z.string(),
  });

export const validationSuppressionValeurAvancement = z.object({
  indicId: z.string(),
  territoireCode: z.string(),
  dateValeurAvancement: z.string(),
  motif: texteDocumentation().min(1, "Veuillez saisir un motif de suppression"),
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
  motifSuppression: texteDocumentation().min(
    1,
    "Le motif de suppression est obligatoire",
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
  motif: texteDocumentation(),
});
