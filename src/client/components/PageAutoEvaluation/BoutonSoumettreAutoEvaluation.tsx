import { pageAutoEvaluationObjectifs } from "@/components/PageAutoEvaluation/objectifs/PageAutoEvaluationObjectifsServerSideContext";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import api from "@/server/infrastructure/api/trpc/api";
import { useEnregistrerBrouillon } from "@/components/PageAutoEvaluation/useEnregistrerBrouillon";
import { useFormEvaluation } from "@/components/PageAutoEvaluation/form";
import { Bouton } from "@/components/_commons/Bouton/Bouton";

// TODO: encore nécessaire ou soumission automatique à la 2e partie soumise ?
export const BoutonSoumettreAutoEvaluation = () => {
  const { autoEvaluation } =
    pageAutoEvaluationObjectifs.useServerSidePropsContext();
  const refreshRouter = useRefreshRouter();
  const soumettreAutoEvaluation =
    api.evaluation.soumettreAutoEvaluation.useMutation();
  const enregistrerBrouillon = useEnregistrerBrouillon(autoEvaluation);
  const form = useFormEvaluation();

  return (
    <Bouton
      label="Soumettre"
      onClick={async () => {
        await form.handleSubmit(enregistrerBrouillon)();
        await soumettreAutoEvaluation.mutateAsync(
          { ficheEvaluationId: autoEvaluation.ficheEvaluationId },
          { onSuccess: refreshRouter },
        );
      }}
    />
  );
};
