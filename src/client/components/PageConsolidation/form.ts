import { z } from "zod";
import { useFormContext } from "react-hook-form";

const evaluationRecordSchema = z.record(
  z.object({
    note: z.number().int().nullable(),
    commentaire: z.string(),
  }),
);

export const formSchema = z.object({
  objectifs: evaluationRecordSchema,
  criteres: evaluationRecordSchema,
});

export type FormValues = z.infer<typeof formSchema>;

export const useFormulaireConsolidation = () => useFormContext<FormValues>();
