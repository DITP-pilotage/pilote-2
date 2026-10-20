import type { AnalyticsDimensions } from "@/client/analytics/schema";
import type { AssistantEvent } from "@/components/_commons/ChatUI/useAssistantTracking";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export const questionType = ({
  previousMessageCount,
  fromProposition,
}: {
  previousMessageCount: number;
  fromProposition: boolean;
}): NonNullable<AnalyticsDimensions["type_question"]> => {
  if (previousMessageCount > 0) return "suivante";
  return fromProposition ? "premiere_proposition" : "premiere_libre";
};

export const llmCallIdOf = (
  message: PiloteUIMessage | undefined,
): string | undefined =>
  message?.role === "assistant" ? message.metadata?.llmCallId : undefined;

export const lastLlmCallId = (
  messages: PiloteUIMessage[],
): string | undefined => llmCallIdOf(messages.at(-1));

// Un arrêt est compté au clic sur « Arrêter » : la fin de flux qui suit, comme
// celles provoquées par une fermeture ou un changement de conversation, ne
// compte pas.
export const answerOutcomeEvent = ({
  conversationId,
  message,
  isAbort,
  isError,
}: {
  conversationId: string;
  message: PiloteUIMessage;
  isAbort: boolean;
  isError: boolean;
}): AssistantEvent | null => {
  if (isAbort) return null;
  const dimensions = {
    conversation_id: conversationId,
    llm_call_id: llmCallIdOf(message),
  };
  return isError
    ? { action: "error", name: "answer.error", dimensions }
    : { action: "success", name: "answer.complete", dimensions };
};
