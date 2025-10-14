import api from "@/server/infrastructure/api/trpc/api";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";
import { FormValues } from "@/components/PageEvaluation/form";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";

export const useEnregistrerBrouillon = () => {
  const enregisterBrouillon = api.evaluation.enregistrerBrouillon.useMutation();
  const { autoEvaluation } = pageEvaluation.useServerSidePropsContext();
  const refreshRouter = useRefreshRouter();

  return (data: FormValues) =>
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
            };
          },
        ),
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
        onSuccess: refreshRouter,
      },
    );
};
