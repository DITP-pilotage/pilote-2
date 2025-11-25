import { toast } from "sonner";
import { useCallback } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import {
  FormCommentaireName,
  FormNoteName,
  FormValues,
} from "@/components/Evaluation/form";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";

export const useEnregistrerBrouillonInstruction = () => {
  const refreshRouter = useRefreshRouter();
  const enregistrerBrouillon =
    api.evaluation.enregistrerBrouillonInstruction.useMutation();
  const mutateAsync = enregistrerBrouillon.mutateAsync;

  return useCallback(
    (
      values: FormValues,
      showToast: boolean,
      fieldName?: FormCommentaireName | FormNoteName,
    ) => {
      let dataToSend;

      if (fieldName) {
        const parts = fieldName.split(".");
        const ficheEvaluationId = parts[1];
        const type = parts[2] as "objectifs" | "criteres";
        const itemId = parts[3];

        const ficheEvaluation = values.fichesEvaluation[ficheEvaluationId];
        const evaluation = ficheEvaluation?.[type]?.[itemId];

        if (!evaluation) {
          return Promise.resolve();
        }

        dataToSend = [
          {
            ficheEvaluationId,
            evaluationsObjectifs:
              type === "objectifs"
                ? [{ ...evaluation, objectifId: itemId }]
                : [],
            evaluationsCriteres:
              type === "criteres" ? [{ ...evaluation, critereId: itemId }] : [],
          },
        ];
      } else {
        dataToSend = Object.entries(values.fichesEvaluation).map(
          ([ficheEvaluationId, { objectifs, criteres }]) => {
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
          },
        );
      }

      return mutateAsync(dataToSend, {
        onSuccess: () => {
          if (showToast) {
            toast.success("Données enregistrées", {
              position: "top-right",
              richColors: true,
            });
          }
          return refreshRouter();
        },
      });
    },
    [mutateAsync, refreshRouter],
  );
};
