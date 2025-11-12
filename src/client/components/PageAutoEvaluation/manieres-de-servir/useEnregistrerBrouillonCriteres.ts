import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { AfficherAutoEvaluationViewModel } from "@/server/evaluation/queries/AfficherAutoEvaluationQuery";
import { FormValuesCriteres } from "@/components/PageAutoEvaluation/manieres-de-servir/form";

export const useEnregistrerBrouillonCriteres = (
  autoEvaluation: AfficherAutoEvaluationViewModel,
) => {
  const enregisterBrouillon =
    api.evaluation.enregistrerBrouillonAutoEvaluationCriteres.useMutation();
  const refreshRouter = useRefreshRouter();

  return (data: FormValuesCriteres) =>
    enregisterBrouillon.mutateAsync(
      {
        ficheEvaluationId: autoEvaluation.ficheEvaluationId,
        evaluationsCriteres: autoEvaluation.criteres.map((critere, index) => {
          const evaluation = data.criteres[index];
          return {
            id: evaluation.id,
            critereId: critere.id,
            note: evaluation.note,
            commentaire: evaluation.commentaire,
          };
        }),
      },
      {
        onSuccess: async () => {
          toast.success("Données enregistrées", {
            position: "top-right",
            richColors: true,
          });
          await refreshRouter();
        },
      },
    );
};
