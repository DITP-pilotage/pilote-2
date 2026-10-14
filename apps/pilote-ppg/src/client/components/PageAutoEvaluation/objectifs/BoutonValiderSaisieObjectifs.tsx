import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { api } from "@/server/framework/trpc/api";
import { useFormEvaluationObjectifs } from "@/components/PageAutoEvaluation/objectifs/form";
import { useEnregistrerBrouillonObjectifs } from "@/components/PageAutoEvaluation/objectifs/useEnregistrerBrouillonObjectifs";
import { ConfirmerValidationSaisie } from "@/components/PageAutoEvaluation/ConfirmerValidationSaisie";
import { SendIcon } from "@/components/_commons/Icones/SendIcon";
import { Button } from "@/components/shared/Button";

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
          toast.success("Objectifs validés", {
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
      <Button
        disabled={validerSaisie.isPending}
        iconRight={<SendIcon className="h-4 w-4" />}
        onClick={handleOpenModal}
      >
        Transmettre le formulaire
      </Button>
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
