import { toast } from "sonner";
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
          toast.success("Les fiches sont retournées en appréciation", {
            position: "top-right",
            richColors: true,
          });
          await refreshRouter();
        },
      },
    );
};
