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
  fichesEvaluation: z.record(
    z.object({
      objectifs: evaluationRecordSchema,
      criteres: evaluationRecordSchema,
    }),
  ),
});

export type FormValues = z.infer<typeof baseFormSchema>;

export const useFormulaireConsolidation = () => useFormContext<FormValues>();

export const getFichesEvaluationParDefaut = (
  rattachements: ConsolidationData,
) =>
  Object.fromEntries(
    rattachements.map((rattachement) => [
      rattachement.ficheEvaluationId,
      {
        objectifs: Object.fromEntries(
          rattachement.objectifs.map((objectif) => [
            objectif.id,
            {
              note: objectif.evaluation.note,
              commentaire: objectif.evaluation.commentaire,
            },
          ]),
        ),
        criteres: Object.fromEntries(
          rattachement.criteres.map((critere) => [
            critere.id,
            {
              note: critere.evaluation.note,
              commentaire: critere.evaluation.commentaire,
            },
          ]),
        ),
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
      const ficheEvaluation =
        obj.fichesEvaluation[rattachement.ficheEvaluationId];
      const consolidationEvaluation = ficheEvaluation?.objectifs[objectif.id];

      return {
        ficheEvaluationId: rattachement.ficheEvaluationId,
        objectifId: objectif.id,
        autoEvaluation,
        consolidationEvaluation,
      };
    })
    .filter(
      ({ autoEvaluation, consolidationEvaluation }) =>
        consolidationEvaluation &&
        autoEvaluation?.note != consolidationEvaluation.note &&
        !consolidationEvaluation.commentaire,
    )
    .map(({ ficheEvaluationId, objectifId }) => ({
      ficheEvaluationId,
      objectifId,
    }));

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
      const ficheEvaluation =
        obj.fichesEvaluation[rattachement.ficheEvaluationId];
      const consolidationEvaluation = ficheEvaluation?.criteres[critere.id];

      return {
        ficheEvaluationId: rattachement.ficheEvaluationId,
        critereId: critere.id,
        autoEvaluation,
        consolidationEvaluation,
      };
    })
    .filter(
      ({ autoEvaluation, consolidationEvaluation }) =>
        consolidationEvaluation &&
        autoEvaluation?.note != consolidationEvaluation.note &&
        !consolidationEvaluation.commentaire,
    )
    .map(({ ficheEvaluationId, critereId }) => ({
      ficheEvaluationId,
      critereId,
    }));
