import { z } from "zod";
import { useFormContext } from "react-hook-form";
import { useMemo } from "react";
import { evaluationSchema } from "@/server/evaluation/schemas";
import { Rattachement } from "@/server/evaluation/queries/types";

export const baseFormSchema = z.object({
  fichesEvaluation: z.record(
    z.object({
      objectifs: z.record(evaluationSchema),
      criteres: z.record(evaluationSchema),
    }),
  ),
});

export type FormValues = z.infer<typeof baseFormSchema>;

export const useFormulaireEvaluation = () => useFormContext<FormValues>();

export const getFichesEvaluationParDefaut = (rattachements: Rattachement[]) =>
  Object.fromEntries(
    rattachements.map((rattachement) => [
      rattachement.ficheEvaluationId,
      {
        objectifs: Object.fromEntries(
          rattachement.objectifs.map((objectif) => [
            objectif.id,
            {
              id: objectif.evaluations[0].evaluation.id,
              note: objectif.evaluations[0].evaluation.note,
              commentaire: objectif.evaluations[0].evaluation.commentaire,
            },
          ]),
        ),
        criteres: Object.fromEntries(
          rattachement.criteres.map((critere) => [
            critere.id,
            {
              id: critere.evaluations[0].evaluation.id,
              note: critere.evaluations[0].evaluation.note,
              commentaire: critere.evaluations[0].evaluation.commentaire,
            },
          ]),
        ),
      },
    ]),
  );

const getEvaluationObjectifEtapePrecedente = (
  rattachement: Rattachement[][number],
  objectifId: string,
) => {
  return rattachement.objectifs.find((objectif) => objectif.id === objectifId)
    ?.evaluations[1]?.evaluation;
};

export const getCommentairesObjectifsInvalides = (
  rattachements: Rattachement[],
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
      const autoEvaluation = getEvaluationObjectifEtapePrecedente(
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

const getEvaluationCritereEtapePrecedente = (
  rattachement: Rattachement[][number],
  critereId: string,
) => {
  return rattachement.criteres.find((critere) => critere.id === critereId)
    ?.evaluations[1]?.evaluation;
};

export const getCommentairesCriteresInvalides = (
  rattachements: Rattachement[],
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
      const autoEvaluation = getEvaluationCritereEtapePrecedente(
        rattachement,
        critere.id,
      );
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

export const useFormSchema = (rattachements: Rattachement[]) => {
  return useMemo(() => {
    return baseFormSchema.superRefine((form, ctx) => {
      for (const {
        ficheEvaluationId,
        objectifId,
      } of getCommentairesObjectifsInvalides(rattachements, form)) {
        ctx.addIssue({
          code: "custom",
          message: "Le motif est obligatoire lorsque la note est modifiée",
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
          message: "Le motif est obligatoire lorsque la note est modifiée",
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

export type FormObjectifCommentaireName =
  `fichesEvaluation.${string}.objectifs.${string}.commentaire`;
export type FormObjectifNoteName =
  `fichesEvaluation.${string}.objectifs.${string}.note`;
export type FormCritereCommentaireName =
  `fichesEvaluation.${string}.criteres.${string}.commentaire`;
export type FormCritereNoteName =
  `fichesEvaluation.${string}.criteres.${string}.note`;
export type FormCommentaireName =
  | FormObjectifCommentaireName
  | FormCritereCommentaireName;
export type FormNoteName = FormObjectifNoteName | FormCritereNoteName;

export const enregistrerUnChamp = (
  values: FormValues,
  fieldName: FormCommentaireName | FormNoteName,
) => {
  const parts = fieldName.split(".");
  const ficheEvaluationId = parts[1];
  const type = parts[2] as "objectifs" | "criteres";
  const itemId = parts[3];

  const ficheEvaluation = values.fichesEvaluation[ficheEvaluationId];
  const evaluation = ficheEvaluation?.[type]?.[itemId];

  if (!evaluation) {
    return null;
  }

  return [
    {
      ficheEvaluationId,
      evaluationsObjectifs:
        type === "objectifs" ? [{ ...evaluation, objectifId: itemId }] : [],
      evaluationsCriteres:
        type === "criteres" ? [{ ...evaluation, critereId: itemId }] : [],
    },
  ];
};

export const enregistrerTousLesChamps = (
  values: FormValues,
  isReadOnly: (ficheEvaluationId: string) => boolean,
) => {
  return Object.entries(values.fichesEvaluation)
    .filter(([ficheEvaluationId]) => !isReadOnly(ficheEvaluationId))
    .map(([ficheEvaluationId, { objectifs, criteres }]) => {
      return {
        ficheEvaluationId,
        evaluationsObjectifs: Object.entries(objectifs).map(
          ([objectifId, evaluation]) => ({
            ...evaluation,
            objectifId,
          }),
        ),
        evaluationsCriteres: Object.entries(criteres).map(
          ([critereId, evaluation]) => ({
            ...evaluation,
            critereId,
          }),
        ),
      };
    });
};
