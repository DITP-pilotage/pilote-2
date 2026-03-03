import { useState } from "react";
import { Dialog } from "radix-ui";
import { FormProvider, useForm } from "react-hook-form";
import { $Enums } from "@prisma/client";
import { Modale } from "@/components/shared/Modale";
import TextAreaAvecLabel from "@/components/_commons/TextAreaAvecLabel/TextAreaAvecLabel";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import api from "@/server/infrastructure/api/trpc/api";

export const FeedbackNegatifModale = ({
  chatId,
  disabled,
  onSuccess,
}: {
  chatId: string;
  disabled: boolean;
  onSuccess: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const form = useForm<{ commentaire: string }>();

  const evaluerMutation = api.albert.evaluer.useMutation({
    onSuccess: () => {
      setOpen(false);
      onSuccess();
    },
  });

  const handleEnvoyer = form.handleSubmit((data) => {
    evaluerMutation.mutate({
      chatId,
      evaluation: $Enums.llm_call_evaluation.NEGATIVE,
      commentaire: data.commentaire,
    });
  });

  return (
    <Modale
      onOpenChange={setOpen}
      open={open}
      size="sm"
      title="Aidez-nous à améliorer l'assistant"
      trigger={
        <button
          className="rounded-full border border-gray-300 px-3 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
          disabled={disabled}
          type="button"
        >
          Non
        </button>
      }
    >
      <FormProvider {...form}>
        <TextAreaAvecLabel
          className="!h-60"
          htmlName="commentaire"
          libellé="Qu'est-ce qui n'allait pas ?"
          register={form.register("commentaire")}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Dialog.Close asChild>
            <Bouton
              label="Annuler"
              variant="secondary"
            />
          </Dialog.Close>
          <Bouton
            disabled={evaluerMutation.isPending}
            label="Envoyer"
            onClick={handleEnvoyer}
            variant="primary"
          />
        </div>
      </FormProvider>
    </Modale>
  );
};
