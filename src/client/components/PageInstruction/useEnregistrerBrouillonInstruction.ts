import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { FormValues } from "@/components/PageInstruction/form";

export const useEnregistrerBrouillonInstruction = () => {
  const enregistrerBrouillon =
    api.evaluation.enregistrerBrouillonInstruction.useMutation();

  return (values: FormValues) =>
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
          toast.success("Données enregistrées", {
            position: "top-right",
            richColors: true,
          });
        },
      },
    );
};
