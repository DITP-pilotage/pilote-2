import { Toaster } from "@/client/utils/toaster";
import api from "@/server/infrastructure/api/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";

export const useRetournerAutoEvaluation = () => {
  const retournerAutoEvaluation =
    api.evaluation.retournerAutoEvaluation.useMutation();
  const refreshRouter = useRefreshRouter();

  return (ficheEvaluationIds: string[]) =>
    retournerAutoEvaluation.mutateAsync(
      { ficheEvaluationIds },
      {
        onSuccess: async () => {
          Toaster.success("Les fiches sont retournées en auto-évaluation");
          await refreshRouter();
        },
      },
    );
};
