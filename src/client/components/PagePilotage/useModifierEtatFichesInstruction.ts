import { Toaster } from "@/client/utils/toaster";
import api from "@/server/infrastructure/api/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";

export const useModifierEtatFichesInstruction = () => {
  const mutation = api.evaluation.modifierEtatFichesInstruction.useMutation();
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
            Toaster.success(
              readOnly
                ? "Les fiches ont correctement été bloquées"
                : "Les fiches ont correctement été débloquées",
            );
            await refreshRouter();
          },
        },
      ),
  };
};
