import { z } from "zod";

const MESSAGE_ERREUR_NOTE = "La valeur doit être comprise entre 0 et 100.";

export const evaluationNoteSchema = z
  .number()
  .int()
  .min(0, MESSAGE_ERREUR_NOTE)
  .max(100, MESSAGE_ERREUR_NOTE);

export const evaluationCommentaireSchema = z
  .string()
  .max(600, "Le commentaire ne doit pas dépasser 600 caractères.");

export const evaluationAnnexeSchema = z.string();

export const evaluationSchema = z.object({
  id: z.string(),
  note: evaluationNoteSchema.nullable(),
  commentaire: evaluationCommentaireSchema,
  annexe: evaluationAnnexeSchema,
});
