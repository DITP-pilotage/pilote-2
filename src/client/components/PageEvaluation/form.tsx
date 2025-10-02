import { z } from "zod";
import { useFormContext } from "react-hook-form";

export const formSchema = z.object({
  criteres: z
    .object({
      sousCriteres: z
        .object({
          note: z.number(),
          commentaire: z.string().max(600),
        })
        .array(),
    })
    .array(),
});

export type FormValues = z.infer<typeof formSchema>;

export const useFormEvaluation = () => useFormContext<FormValues>();
