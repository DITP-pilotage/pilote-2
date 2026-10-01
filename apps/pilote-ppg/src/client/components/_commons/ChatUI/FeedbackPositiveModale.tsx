import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { Dialog } from "radix-ui";
import { $Enums } from "@prisma/client";
import { Modale } from "@/components/shared/Modale";
import api from "@/server/infrastructure/api/trpc/api";

export const FeedbackPositiveModale = ({
  chatId,
  open,
  onOpenChange,
  onSuccess,
}: {
  chatId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) => {
  const [commentaire, setCommentaire] = useState("");

  const evaluerMutation = api.albert.evaluer.useMutation({
    onSuccess: () => {
      onOpenChange(false);
      onSuccess();
    },
  });

  const handleEnvoyer = () => {
    evaluerMutation.mutate({
      chatId,
      evaluation: $Enums.llm_call_evaluation.POSITIVE,
      commentaire: commentaire.trim() || undefined,
    });
  };

  return (
    <Modale
      onOpenChange={(ouvert) => {
        onOpenChange(ouvert);
        if (!ouvert) setCommentaire("");
      }}
      open={open}
      size="md"
      sousTitre="Dites-nous ce qui vous a plu (optionnel)"
      title="Merci pour votre retour !"
    >
      <div>
        <label
          className="font-medium text-gray-900"
          htmlFor="feedback-positif-commentaire"
        >
          Qu&apos;avez-vous particulièrement apprécié ?{" "}
          <span className="font-normal text-gray-500">(optionnel)</span>
        </label>
        <textarea
          className="mt-2 w-full rounded-md border border-gray-300 p-3 text-sm h-40 resize-none"
          id="feedback-positif-commentaire"
          onChange={(event) => setCommentaire(event.target.value)}
          placeholder="Partagez ce qui vous a aidé..."
          value={commentaire}
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Dialog.Close asChild>
          <Button variant="secondary">Annuler</Button>
        </Dialog.Close>
        <Button
          disabled={evaluerMutation.isPending}
          onClick={handleEnvoyer}
          variant="primary"
        >
          Envoyer
        </Button>
      </div>
    </Modale>
  );
};
