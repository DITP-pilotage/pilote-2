import { toast } from "sonner";
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
          toast.success("Les fiches sont retournées en auto-évaluation", {
            position: "top-right",
            richColors: true,
          });
          await refreshRouter();
        },
      },
    );
};
