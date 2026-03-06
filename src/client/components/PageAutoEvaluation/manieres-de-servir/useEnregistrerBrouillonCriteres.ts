import { Toaster } from "@/client/utils/toaster";
import api from "@/server/infrastructure/api/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { FormValuesCriteres } from "@/components/PageAutoEvaluation/manieres-de-servir/form";
import { pageAutoEvaluationManieresDeServir } from "@/components/PageAutoEvaluation/manieres-de-servir/PageAutoEvaluationManieresDeServirServerSideContext";

export const useEnregistrerBrouillonCriteres = ({
  showToast = true,
}: { showToast?: boolean } = {}) => {
  const { autoEvaluation } =
    pageAutoEvaluationManieresDeServir.useServerSidePropsContext();
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
            annexe: evaluation.annexe,
          };
        }),
      },
      {
        onSuccess: async () => {
          if (showToast) {
            Toaster.success("Données enregistrées");
          }
          await refreshRouter();
        },
      },
    );
};
