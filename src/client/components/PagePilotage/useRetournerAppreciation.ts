import { Toaster } from "@/client/utils/toaster";
import api from "@/server/infrastructure/api/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";

export const useRetournerAppreciation = () => {
  const retournerAppreciation =
    api.evaluation.retournerAppreciation.useMutation();
  const refreshRouter = useRefreshRouter();

  return (ficheEvaluationIds: string[]) =>
    retournerAppreciation.mutateAsync(
      { ficheEvaluationIds },
      {
        onSuccess: async () => {
          Toaster.success("Les fiches sont retournées en appréciation");
          await refreshRouter();
        },
      },
    );
};
