import api from "@/server/infrastructure/api/trpc/api";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";
import { FormValues } from "@/components/PageEvaluation/form";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";

export function useEnregistrerBrouillon() {
  const enregisterBrouillon = api.evaluation.enregistrerBrouillon.useMutation();
  const { autoEvaluation } = pageEvaluation.useServerSidePropsContext();
  const refreshRouter = useRefreshRouter();

  return (data: FormValues) => {
    enregisterBrouillon.mutate(
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
        evaluationsSousCriteres: autoEvaluation.criteres.flatMap(
          (critere, index) =>
            critere.sousCriteres.map((sousCritere, jindex) => {
              const evaluation = data.criteres[index].sousCriteres[jindex];
              return {
                id: evaluation.id,
                sousCritereId: sousCritere.id,
                note: evaluation.note,
                commentaire: evaluation.commentaire,
              };
            }),
        ),
      },
      {
        onSuccess: refreshRouter,
      },
    );
  };
}
