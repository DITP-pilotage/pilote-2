import { useState } from "react";
import { ActionReponse } from "@/components/_commons/ChatUI/ActionReponse";
import { FeedbackNegatifModale } from "@/components/_commons/ChatUI/FeedbackNegatifModale";
import { FeedbackPositiveModale } from "@/components/_commons/ChatUI/FeedbackPositiveModale";
import { ThumbUpIcon } from "@/components/_commons/Icones/ThumbUpIcon";

export const EvaluationReponse = ({ chatId }: { chatId: string }) => {
  const [evaluationSoumise, setEvaluationSoumise] = useState(false);
  const [positiveOuverte, setPositiveOuverte] = useState(false);

  if (evaluationSoumise) {
    return (
      <span className="px-2 text-xs text-dsfr-mention-grey">
        Merci pour votre retour !
      </span>
    );
  }

  return (
    <>
      <ActionReponse
        icone={ThumbUpIcon}
        label="Utile"
        onClick={() => setPositiveOuverte(true)}
      />
      <FeedbackNegatifModale
        chatId={chatId}
        disabled={false}
        onSuccess={() => setEvaluationSoumise(true)}
      />
      <FeedbackPositiveModale
        chatId={chatId}
        onOpenChange={setPositiveOuverte}
        onSuccess={() => setEvaluationSoumise(true)}
        open={positiveOuverte}
      />
    </>
  );
};
