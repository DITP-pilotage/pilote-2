import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";

export const useDebloquerFiches = () => {
  const debloquerFiches =
    api.evaluation.debloquerFichesConsolidation.useMutation();
  const refreshRouter = useRefreshRouter();

  return (ficheEvaluationIds: string[]) =>
    debloquerFiches.mutateAsync(
      {
        ficheEvaluationIds,
      },
      {
        onSuccess: async () => {
          toast.success("Les fiches ont correctement été débloquées", {
            position: "top-right",
            richColors: true,
          });
          await refreshRouter();
        },
      },
    );
};
