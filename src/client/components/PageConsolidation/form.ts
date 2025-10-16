import { z } from "zod";
import { useFormContext } from "react-hook-form";
import { useMemo } from "react";
import { ConsolidationData } from "@/server/evaluation/queries/AfficherConsolidationQuery";
import { pageConsolidation } from "@/components/PageConsolidation/PageConsolidationServerSideContext";
import { evaluationSchema } from "@/server/evaluation/schemas";

export const baseFormSchema = z.object({
  fichesEvaluation: z.record(
    z.object({
      objectifs: z.record(evaluationSchema),
      criteres: z.record(evaluationSchema),
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
              id: objectif.evaluation.id,
              note: objectif.evaluation.note,
              commentaire: objectif.evaluation.commentaire,
            },
          ]),
        ),
        criteres: Object.fromEntries(
          rattachement.criteres.map((critere) => [
            critere.id,
            {
              id: critere.evaluation.id,
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

export const useFormSchema = () => {
  const { rattachements } = pageConsolidation.useServerSidePropsContext();
  return useMemo(() => {
    return baseFormSchema.superRefine((form, ctx) => {
      for (const {
        ficheEvaluationId,
        objectifId,
      } of getCommentairesObjectifsInvalides(rattachements, form)) {
        ctx.addIssue({
          code: "custom",
          message:
            "Le motif de consolidation est obligatoire lorsque la note est modifiée",
          path: [
            "fichesEvaluation",
            ficheEvaluationId,
            "objectifs",
            objectifId,
            "commentaire",
          ],
        });
      }

      for (const {
        ficheEvaluationId,
        critereId,
      } of getCommentairesCriteresInvalides(rattachements, form)) {
        ctx.addIssue({
          code: "custom",
          message:
            "Le motif de consolidation est obligatoire lorsque la note est modifiée",
          path: [
            "fichesEvaluation",
            ficheEvaluationId,
            "criteres",
            critereId,
            "commentaire",
          ],
        });
      }
    });
  }, [rattachements]);
};
