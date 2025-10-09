import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import api from "@/server/infrastructure/api/trpc/api";
import { useEnregistrerBrouillon } from "@/components/PageEvaluation/useEnregistrerBrouillon";
import { useFormEvaluation } from "@/components/PageEvaluation/form";
import { Bouton } from "@/components/_commons/Bouton/Bouton";

export const BoutonSoumettreAutoEvaluation = () => {
  const { autoEvaluation } = pageEvaluation.useServerSidePropsContext();
  const refreshRouter = useRefreshRouter();
  const soumettreAutoEvaluation =
    api.evaluation.soumettreAutoEvaluation.useMutation();
  const enregistrerBrouillon = useEnregistrerBrouillon();
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
