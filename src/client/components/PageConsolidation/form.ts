import { z } from "zod";
import { useFormContext } from "react-hook-form";
import { ConsolidationData } from "@/server/evaluation/queries/AfficherConsolidationQuery";

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

export const getObjectifsParDefaut = (rattachements: ConsolidationData) =>
  Object.fromEntries(
    rattachements
      .flatMap((rattachement) => rattachement.objectifs)
      .map((objectif) => [
        objectif.id,
        {
          note: objectif.evaluation.note ?? undefined,
          commentaire: objectif.evaluation.commentaire,
        },
      ]),
  );

export const getCriteresParDefaut = (rattachements: ConsolidationData) =>
  Object.fromEntries(
    rattachements
      .flatMap((rattachement) => rattachement.criteres)
      .map((critere) => [
        critere.id,
        {
          note: critere.evaluation.note ?? undefined,
          commentaire: critere.evaluation.commentaire,
        },
      ]),
  );
