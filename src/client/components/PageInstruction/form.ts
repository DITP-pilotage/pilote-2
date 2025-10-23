import { z } from "zod";
import { useFormContext } from "react-hook-form";
import { useMemo } from "react";
import { InstructionData } from "@/server/evaluation/queries/AfficherInstructionQuery";
import { pageInstruction } from "@/components/PageInstruction/PageInstructionServerSideContext";
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

export const useFormulaireInstruction = () => useFormContext<FormValues>();

export const getFichesEvaluationParDefaut = (rattachements: InstructionData) =>
  Object.fromEntries(
    rattachements.map((rattachement) => [
      rattachement.ficheEvaluationId,
      {
        objectifs: Object.fromEntries(
          rattachement.objectifs.map((objectif) => [
            objectif.id,
            {
              id: objectif.instruction.id,
              note: objectif.instruction.note,
              commentaire: objectif.instruction.commentaire,
            },
          ]),
        ),
        criteres: Object.fromEntries(
          rattachement.criteres.map((critere) => [
            critere.id,
            {
              id: critere.instruction.id,
              note: critere.instruction.note,
              commentaire: critere.instruction.commentaire,
            },
          ]),
        ),
      },
    ]),
  );

const getConsolidationObjectif = (
  rattachement: InstructionData[number],
  objectifId: string,
) => {
  return rattachement.objectifs.find((objectif) => objectif.id === objectifId)
    ?.consolidation;
};

export const getCommentairesObjectifsInvalides = (
  rattachements: InstructionData,
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
      const consolidation = getConsolidationObjectif(rattachement, objectif.id);
      const ficheEvaluation =
        obj.fichesEvaluation[rattachement.ficheEvaluationId];
      const instructionEvaluation = ficheEvaluation?.objectifs[objectif.id];

      return {
        ficheEvaluationId: rattachement.ficheEvaluationId,
        objectifId: objectif.id,
        consolidation,
        instructionEvaluation,
      };
    })
    .filter(
      ({ consolidation, instructionEvaluation }) =>
        instructionEvaluation &&
        consolidation?.note != instructionEvaluation.note &&
        !instructionEvaluation.commentaire,
    )
    .map(({ ficheEvaluationId, objectifId }) => ({
      ficheEvaluationId,
      objectifId,
    }));

const getConsolidationCritere = (
  rattachement: InstructionData[number],
  critereId: string,
) => {
  return rattachement.criteres.find((critere) => critere.id === critereId)
    ?.consolidation;
};

export const getCommentairesCriteresInvalides = (
  rattachements: InstructionData,
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
      const consolidation = getConsolidationCritere(rattachement, critere.id);
      const ficheEvaluation =
        obj.fichesEvaluation[rattachement.ficheEvaluationId];
      const instructionEvaluation = ficheEvaluation?.criteres[critere.id];

      return {
        ficheEvaluationId: rattachement.ficheEvaluationId,
        critereId: critere.id,
        consolidation,
        instructionEvaluation,
      };
    })
    .filter(
      ({ consolidation, instructionEvaluation }) =>
        instructionEvaluation &&
        consolidation?.note != instructionEvaluation.note &&
        !instructionEvaluation.commentaire,
    )
    .map(({ ficheEvaluationId, critereId }) => ({
      ficheEvaluationId,
      critereId,
    }));

export const useFormSchema = () => {
  const { rattachements } = pageInstruction.useServerSidePropsContext();
  return useMemo(() => {
    return baseFormSchema.superRefine((form, ctx) => {
      for (const {
        ficheEvaluationId,
        objectifId,
      } of getCommentairesObjectifsInvalides(rattachements, form)) {
        ctx.addIssue({
          code: "custom",
          message:
            "Le motif d'instruction est obligatoire lorsque la note est modifiée",
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
            "Le motif d'instruction est obligatoire lorsque la note est modifiée",
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
