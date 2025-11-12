import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";

export const useModifierEtatFichesConsolidation = () => {
  const mutation = api.evaluation.modifierEtatFichesConsolidation.useMutation();
  const refreshRouter = useRefreshRouter();

  return {
    modifierEtat: (ficheEvaluationIds: string[], readOnly: boolean) =>
      mutation.mutateAsync(
        {
          ficheEvaluationIds,
          readOnly,
        },
        {
          onSuccess: async () => {
            toast.success(
              readOnly
                ? "Les fiches ont correctement été bloquées"
                : "Les fiches ont correctement été débloquées",
              {
                position: "top-right",
                richColors: true,
              },
            );
            await refreshRouter();
          },
        },
      ),
  };
};
