import { z } from "zod";
import { useFormContext } from "react-hook-form";

export const formSchema = z.object({
  criteres: z
    .object({
      sousCriteres: z
        .object({
          id: z.string(),
          note: z.number(),
          commentaire: z.string().max(600),
        })
        .array(),
    })
    .array(),
  objectifs: z
    .object({
      id: z.string(),
      note: z.number(),
      commentaire: z.string().max(600),
    })
    .array(),
});

export type FormValues = z.infer<typeof formSchema>;

export const useFormEvaluation = () => useFormContext<FormValues>();
