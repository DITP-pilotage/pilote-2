import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { FormValues } from "@/components/Evaluation/form";

export const useEnregistrerBrouillonConsolidation = () => {
  const enregistrerBrouillon =
    api.evaluation.enregistrerBrouillonConsolidation.useMutation();

  return (values: FormValues, showToast: boolean) =>
    enregistrerBrouillon.mutateAsync(
      Object.entries(values.fichesEvaluation).map(
        ([ficheEvaluationId, { objectifs, criteres }]) => {
          return {
            ficheEvaluationId,
            evaluationsObjectifs: Object.entries(objectifs).map(
              ([objectifId, evaluation]) => ({
                ...evaluation,
                objectifId,
              }),
            ),
            evaluationsCriteres: Object.entries(criteres).map(
              ([critereId, evaluation]) => ({
                ...evaluation,
                critereId,
              }),
            ),
          };
        },
      ),
      {
        onSuccess: () => {
          if (showToast) {
            toast.success("Données enregistrées", {
              position: "top-right",
              richColors: true,
            });
          }
        },
      },
    );
};
