import { toast } from "sonner";
import { useCallback } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { FormValues } from "@/components/Evaluation/form";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";

export const useEnregistrerBrouillonConsolidation = () => {
  const refreshRouter = useRefreshRouter();
  const enregistrerBrouillon =
    api.evaluation.enregistrerBrouillonConsolidation.useMutation();
  // Attention : enregistrerBrouillon.mutateAsync est stable
  //  mais enregistrerBrouillon lui-même ne l'est pas
  const mutateAsync = enregistrerBrouillon.mutateAsync;

  return useCallback(
    (values: FormValues, showToast: boolean) =>
      mutateAsync(
        Object.entries(values.fichesEvaluation).map(
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
        ),
        {
          onSuccess: async () => {
            if (showToast) {
              toast.success("Données enregistrées", {
                position: "top-right",
                richColors: true,
              });
            }
            return refreshRouter();
          },
        },
      ),
    [mutateAsync, refreshRouter],
  );
};
