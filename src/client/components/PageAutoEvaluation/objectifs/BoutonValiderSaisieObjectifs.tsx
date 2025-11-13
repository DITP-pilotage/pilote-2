import { useId } from "react";
import { toast } from "sonner";
import api from "@/server/infrastructure/api/trpc/api";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { useFormEvaluationObjectifs } from "@/components/PageAutoEvaluation/objectifs/form";
import { useEnregistrerBrouillonObjectifs } from "@/components/PageAutoEvaluation/objectifs/useEnregistrerBrouillonObjectifs";
import { ConfirmerValidationSaisie } from "@/components/PageAutoEvaluation/ConfirmerValidationSaisie";

export const BoutonValiderSaisieObjectifs = ({
  ficheEvaluationId,
}: {
  ficheEvaluationId: string;
}) => {
  const idModale = useId();
  const validerSaisie = api.evaluation.validerSaisieObjectifs.useMutation();
  const refreshRouter = useRefreshRouter();
  const form = useFormEvaluationObjectifs();
  const enregistrerBrouillon = useEnregistrerBrouillonObjectifs({
    showToast: false,
  });

  const handleOpenModal = async () => {
    const isFormValid = await form.trigger();
    if (!isFormValid) return;

    await form.handleSubmit(enregistrerBrouillon)();
  };

  const handleConfirmValidation = async () => {
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
        typeEvaluation="objectifs"
      />
    </div>
  );
};
