import { toast } from "sonner";
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
          toast.success("Les fiches sont passées en consolidation", {
            position: "top-right",
            richColors: true,
          });
          await refreshRouter();
        },
      },
    );
};
