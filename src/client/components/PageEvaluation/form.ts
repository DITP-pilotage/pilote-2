import { z } from "zod";
import { useFormContext } from "react-hook-form";

const MESSAGE_ERREUR_NOTE = "La valeur doit être comprise entre 0 et 100.";
const evaluationSchema = z.object({
  id: z.string(),
  note: z
    .number()
    .min(0, MESSAGE_ERREUR_NOTE)
    .max(100, MESSAGE_ERREUR_NOTE)
    .nullable(),
  commentaire: z
    .string()
    .max(600, "Le commentaire ne doit pas dépasser 600 caractères."),
});

export const formSchema = z.object({
  criteres: evaluationSchema.array(),
  objectifs: evaluationSchema.array(),
});

export type FormValues = z.infer<typeof formSchema>;

export const useFormEvaluation = () => useFormContext<FormValues>();
