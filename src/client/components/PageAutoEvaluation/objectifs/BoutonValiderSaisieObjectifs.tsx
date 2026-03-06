import { useState } from "react";
import { useRouter } from "next/router";
import { Toaster } from "@/client/utils/toaster";
import api from "@/server/infrastructure/api/trpc/api";
import { useFormEvaluationObjectifs } from "@/components/PageAutoEvaluation/objectifs/form";
import { useEnregistrerBrouillonObjectifs } from "@/components/PageAutoEvaluation/objectifs/useEnregistrerBrouillonObjectifs";
import { ConfirmerValidationSaisie } from "@/components/PageAutoEvaluation/ConfirmerValidationSaisie";
import { SendIcon } from "@/components/_commons/Icones/SendIcon";

export const BoutonValiderSaisieObjectifs = ({
  ficheEvaluationId,
}: {
  ficheEvaluationId: string;
}) => {
  const [open, setOpen] = useState(false);
  const validerSaisie = api.evaluation.validerSaisieObjectifs.useMutation();
  const router = useRouter();
  const form = useFormEvaluationObjectifs();
  const enregistrerBrouillon = useEnregistrerBrouillonObjectifs({
    showToast: false,
  });

  const handleOpenModal = async () => {
    const isFormValid = await form.trigger();
    if (!isFormValid) return;

    await form.handleSubmit(enregistrerBrouillon)();
    setOpen(true);
  };

  const handleConfirmValidation = async () => {
    await validerSaisie.mutateAsync(
      { ficheEvaluationId },
      {
        onSuccess: async () => {
          Toaster.success("Objectifs validés");
          await router.push("/evaluation/auto-evaluation");
        },
        onError: () => {
          Toaster.error("Erreur lors de la validation");
        },
      },
    );
  };

  return (
    <div>
      <button
        className="fr-btn"
        disabled={validerSaisie.isPending}
        onClick={handleOpenModal}
        type="button"
      >
        Transmettre le formulaire
        <SendIcon className="h-4 w-4 ml-2" />
      </button>
      <ConfirmerValidationSaisie
        annee={2025}
        isPending={validerSaisie.isPending}
        onConfirm={handleConfirmValidation}
        onOpenChange={setOpen}
        open={open}
        typeEvaluation="objectifs"
      />
    </div>
  );
};
