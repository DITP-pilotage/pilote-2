import { z } from "zod";
import { useFormContext } from "react-hook-form";

const evaluationRecordSchema = z.record(
  z.object({
    note: z.number().int().nullable(),
    commentaire: z.string(),
    statut_evaluation: z.enum(["VERIFIE", "A_VERIFIER"]),
  }),
);

export const formSchema = z.object({
  objectifs: evaluationRecordSchema,
  sousCriteres: evaluationRecordSchema,
});

export type FormValues = z.infer<typeof formSchema>;

export const useFormulaireConsolidation = () => useFormContext<FormValues>();
