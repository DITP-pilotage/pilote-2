import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { useFormEvaluationCriteres } from "@/components/PageAutoEvaluation/manieres-de-servir/form";
import { useEnregistrerBrouillonCriteres } from "@/components/PageAutoEvaluation/manieres-de-servir/useEnregistrerBrouillonCriteres";

export const BoutonValiderSaisieCriteres = ({
  ficheEvaluationId,
}: {
  ficheEvaluationId: string;
}) => {
  const validerSaisie = api.evaluation.validerSaisieCriteres.useMutation();
  const refreshRouter = useRefreshRouter();
  const form = useFormEvaluationCriteres();
  const enregistrer = useEnregistrerBrouillonCriteres({ showToast: false });

  const handleClick = async () => {
    const isFormValid = await form.trigger();
    if (!isFormValid) return;

    await form.handleSubmit(enregistrer)();

    await validerSaisie.mutateAsync(
      { ficheEvaluationId },
      {
        onSuccess: async () => {
          toast.success("Manières de servir validées", {
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
