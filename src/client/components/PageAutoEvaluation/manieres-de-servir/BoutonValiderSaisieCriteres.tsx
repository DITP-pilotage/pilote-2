import { useId } from "react";
import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { useFormEvaluationCriteres } from "@/components/PageAutoEvaluation/manieres-de-servir/form";
import { useEnregistrerBrouillonCriteres } from "@/components/PageAutoEvaluation/manieres-de-servir/useEnregistrerBrouillonCriteres";
import { ConfirmerValidationSaisie } from "@/components/PageAutoEvaluation/ConfirmerValidationSaisie";

export const BoutonValiderSaisieCriteres = ({
  ficheEvaluationId,
}: {
  ficheEvaluationId: string;
}) => {
  const idModale = useId();
  const validerSaisie = api.evaluation.validerSaisieCriteres.useMutation();
  const refreshRouter = useRefreshRouter();
  const form = useFormEvaluationCriteres();
  const enregistrer = useEnregistrerBrouillonCriteres({ showToast: false });

  const handleOpenModal = async () => {
    const isFormValid = await form.trigger();
    if (!isFormValid) return;

    await form.handleSubmit(enregistrer)();
  };

  const handleConfirmValidation = async () => {
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
    <div>
      <button
        aria-controls={idModale}
        className="fr-btn"
        data-fr-opened="false"
        disabled={validerSaisie.isLoading}
        onClick={handleOpenModal}
        type="button"
      >
        Valider
      </button>
      <ConfirmerValidationSaisie
        annee={2025}
        generatedHTMLID={idModale}
        isPending={validerSaisie.isLoading}
        onConfirm={handleConfirmValidation}
        typeEvaluation="manieres-de-servir"
      />
    </div>
  );
};
