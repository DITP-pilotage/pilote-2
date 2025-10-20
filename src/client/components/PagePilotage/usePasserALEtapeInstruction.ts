import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";

export const usePasserALEtapeInstruction = () => {
  const passerALEtapeInstruction =
    api.evaluation.passerALEtapeInstruction.useMutation();
  const refreshRouter = useRefreshRouter();

  return (ficheEvaluationIds: string[]) =>
    passerALEtapeInstruction.mutateAsync(
      {
        ficheEvaluationIds,
      },
      {
        onSuccess: async () => {
          toast.success("Les fiches sont passées en instruction", {
            position: "top-right",
            richColors: true,
          });
          await refreshRouter();
        },
      },
    );
};
