import { z } from "zod";
import { useFormContext } from "react-hook-form";
import { ConsolidationData } from "@/server/evaluation/queries/AfficherConsolidationQuery";

const evaluationRecordSchema = z.record(
  z.object({
    note: z.number().int().nullable(),
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
          note: objectif.evaluation.note,
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
          note: critere.evaluation.note,
          commentaire: critere.evaluation.commentaire,
        },
      ]),
  );
const getAutoEvaluationObjectif = (
  rattachement: ConsolidationData[number],
  objectifId: string,
) => {
  return rattachement.objectifs.find((objectif) => objectif.id === objectifId)
    ?.autoEvaluation;
};

export const getCommentairesObjectifsInvalides = (
  rattachements: ConsolidationData,
  obj: FormValues,
) =>
  rattachements
    .flatMap((rattachement) =>
      rattachement.objectifs.map((objectif) => ({
        rattachement,
        objectif,
      })),
    )
    .map(({ objectif, rattachement }) => {
      const autoEvaluation = getAutoEvaluationObjectif(
        rattachement,
        objectif.id,
      );
      const consolidationEvaluation = obj.objectifs[objectif.id];

      return {
        objectifId: objectif.id,
        autoEvaluation,
        consolidationEvaluation,
      };
    })
    .filter(
      ({ autoEvaluation, consolidationEvaluation }) =>
        autoEvaluation?.note != consolidationEvaluation.note &&
        !consolidationEvaluation.commentaire,
    )
    .map(({ objectifId }) => objectifId);

const getAutoEvaluationCritere = (
  rattachement: ConsolidationData[number],
  critereId: string,
) => {
  return rattachement.criteres.find((critere) => critere.id === critereId)
    ?.autoEvaluation;
};

export const getCommentairesCriteresInvalides = (
  rattachements: ConsolidationData,
  obj: FormValues,
) =>
  rattachements
    .flatMap((rattachement) =>
      rattachement.criteres.map((critere) => ({
        rattachement,
        critere,
      })),
    )
    .map(({ critere, rattachement }) => {
      const autoEvaluation = getAutoEvaluationCritere(rattachement, critere.id);
      const consolidationEvaluation = obj.criteres[critere.id];

      return {
        critereId: critere.id,
        autoEvaluation,
        consolidationEvaluation,
      };
    })
    .filter(
      ({ autoEvaluation, consolidationEvaluation }) =>
        autoEvaluation?.note != consolidationEvaluation.note &&
        !consolidationEvaluation.commentaire,
    )
    .map(({ critereId }) => critereId);
