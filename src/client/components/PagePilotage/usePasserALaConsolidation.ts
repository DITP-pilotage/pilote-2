import { Toaster } from "@/client/utils/toaster";
import api from "@/server/infrastructure/api/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";

export const usePasserALaConsolidation = () => {
  const passerALaConsolidation =
    api.evaluation.passerALaConsolidation.useMutation();
  const refreshRouter = useRefreshRouter();

  return (ficheEvaluationIds: string[]) =>
    passerALaConsolidation.mutateAsync(
      {
        ficheEvaluationIds,
      },
      {
        onSuccess: async () => {
          Toaster.success("Les fiches sont passées en consolidation");
          await refreshRouter();
        },
      },
    );
};
