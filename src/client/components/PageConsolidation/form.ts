import { z } from "zod";
import { useFormContext } from "react-hook-form";

const evaluationRecordSchema = z.record(
  z.object({
    note: z.number({ invalid_type_error: "La note est obligatoire" }).int(),
    commentaire: z.string(),
  }),
);

export const baseFormSchema = z.object({
  objectifs: evaluationRecordSchema,
  criteres: evaluationRecordSchema,
});

export type FormValues = z.infer<typeof baseFormSchema>;

export const useFormulaireConsolidation = () => useFormContext<FormValues>();
