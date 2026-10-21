import { useState } from "react";
import { ActionReponse } from "@/components/_commons/ChatUI/ActionReponse";
import { FeedbackNegatifModale } from "@/components/_commons/ChatUI/FeedbackNegatifModale";
import { FeedbackPositiveModale } from "@/components/_commons/ChatUI/FeedbackPositiveModale";
import { ThumbUpIcon } from "@/components/_commons/Icones/ThumbUpIcon";
import { useChatContext } from "@/components/_commons/ChatUI/ChatContext";
import type { AnalyticsAction } from "@/client/analytics/schema";

export const EvaluationReponse = ({
  chatId,
  llmCallId,
}: {
  chatId: string;
  llmCallId: string | undefined;
}) => {
  const [evaluationSoumise, setEvaluationSoumise] = useState(false);
  const [positiveOuverte, setPositiveOuverte] = useState(false);
  const { track } = useChatContext();

  const trackFeedback = (
    action: Extract<AnalyticsAction, "open" | "success">,
    name: "feedback.positive" | "feedback.negative",
  ) => track({ action, name, dimensions: { llm_call_id: llmCallId } });

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
        onClick={() => {
          trackFeedback("open", "feedback.positive");
          setPositiveOuverte(true);
        }}
      />
      <FeedbackNegatifModale
        chatId={chatId}
        disabled={false}
        onOpen={() => trackFeedback("open", "feedback.negative")}
        onSuccess={() => {
          trackFeedback("success", "feedback.negative");
          setEvaluationSoumise(true);
        }}
      />
      <FeedbackPositiveModale
        chatId={chatId}
        onOpenChange={setPositiveOuverte}
        onSuccess={() => {
          trackFeedback("success", "feedback.positive");
          setEvaluationSoumise(true);
        }}
        open={positiveOuverte}
      />
    </>
  );
};
