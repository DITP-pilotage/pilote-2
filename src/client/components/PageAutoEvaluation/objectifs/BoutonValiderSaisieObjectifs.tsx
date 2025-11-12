import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { useFormEvaluationObjectifs } from "@/components/PageAutoEvaluation/objectifs/form";
import { useEnregistrerBrouillonObjectifs } from "@/components/PageAutoEvaluation/objectifs/useEnregistrerBrouillonObjectifs";

export const BoutonValiderSaisieObjectifs = ({
  ficheEvaluationId,
}: {
  ficheEvaluationId: string;
}) => {
  const validerSaisie = api.evaluation.validerSaisieObjectifs.useMutation();
  const refreshRouter = useRefreshRouter();
  const form = useFormEvaluationObjectifs();
  const enregistrerBrouillon = useEnregistrerBrouillonObjectifs({
    showToast: false,
  });

  const handleClick = async () => {
    const isFormValid = await form.trigger();
    if (!isFormValid) return;

    await form.handleSubmit(enregistrerBrouillon)();
    await validerSaisie.mutateAsync(
      { ficheEvaluationId },
      {
        onSuccess: async () => {
          toast.success("Objectifs validés", {
            position: "top-right",
            richColors: true,
          });
          await refreshRouter();
        },
        onError: () => {
          toast.error("Erreur lors de la validation", {
            position: "top-right",
            richColors: true,
          });
        },
      },
    );
  };

  return (
    <Bouton
      disabled={validerSaisie.isLoading}
      label="Valider"
      onClick={handleClick}
      type="button"
      variant="primary"
    />
  );
};
