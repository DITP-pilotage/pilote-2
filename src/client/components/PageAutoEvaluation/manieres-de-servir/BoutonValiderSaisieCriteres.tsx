import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/router";
import api from "@/server/infrastructure/api/trpc/api";
import { useFormEvaluationCriteres } from "@/components/PageAutoEvaluation/manieres-de-servir/form";
import { useEnregistrerBrouillonCriteres } from "@/components/PageAutoEvaluation/manieres-de-servir/useEnregistrerBrouillonCriteres";
import { ConfirmerValidationSaisie } from "@/components/PageAutoEvaluation/ConfirmerValidationSaisie";
import { SendIcon } from "@/components/_commons/Icones/SendIcon";

export const BoutonValiderSaisieCriteres = ({
  ficheEvaluationId,
}: {
  ficheEvaluationId: string;
}) => {
  const [open, setOpen] = useState(false);
  const validerSaisie = api.evaluation.validerSaisieCriteres.useMutation();
  const router = useRouter();
  const form = useFormEvaluationCriteres();
  const enregistrer = useEnregistrerBrouillonCriteres({ showToast: false });

  const handleOpenModal = async () => {
    const isFormValid = await form.trigger();
    if (!isFormValid) return;

    await form.handleSubmit(enregistrer)();
    setOpen(true);
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
          await router.push("/evaluation/auto-evaluation");
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
        className="fr-btn"
        disabled={validerSaisie.isLoading}
        onClick={handleOpenModal}
        type="button"
      >
        Transmettre le formulaire
        <SendIcon className="h-4 w-4 ml-2" />
      </button>
      <ConfirmerValidationSaisie
        annee={2025}
        isPending={validerSaisie.isLoading}
        onConfirm={handleConfirmValidation}
        onOpenChange={setOpen}
        open={open}
        typeEvaluation="manieres-de-servir"
      />
    </div>
  );
};
