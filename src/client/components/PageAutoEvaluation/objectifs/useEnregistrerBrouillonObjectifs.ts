import { Toaster } from "@/client/utils/toaster";
import api from "@/server/infrastructure/api/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { FormValuesObjectifs } from "@/components/PageAutoEvaluation/objectifs/form";
import { pageAutoEvaluationObjectifs } from "@/components/PageAutoEvaluation/objectifs/PageAutoEvaluationObjectifsServerSideContext";

export const useEnregistrerBrouillonObjectifs = ({
  showToast = true,
}: { showToast?: boolean } = {}) => {
  const { autoEvaluation } =
    pageAutoEvaluationObjectifs.useServerSidePropsContext();
  const enregisterBrouillon =
    api.evaluation.enregistrerBrouillonAutoEvaluationObjectifs.useMutation();
  const refreshRouter = useRefreshRouter();

  return (data: FormValuesObjectifs) =>
    enregisterBrouillon.mutateAsync(
      {
        ficheEvaluationId: autoEvaluation.ficheEvaluationId,
        evaluationsObjectifs: autoEvaluation.objectifs.map(
          (objectif, index) => {
            const evaluation = data.objectifs[index];
            return {
              id: evaluation.id,
              objectifId: objectif.id,
              note: evaluation.note,
              commentaire: evaluation.commentaire,
              annexe: evaluation.annexe,
            };
          },
        ),
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
