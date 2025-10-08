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
  commentaire: z.string().max(600),
});

export const formSchema = z.object({
  criteres: z.object({ sousCriteres: evaluationSchema.array() }).array(),
  objectifs: evaluationSchema.array(),
});

export type FormValues = z.infer<typeof formSchema>;

export const useFormEvaluation = () => useFormContext<FormValues>();
