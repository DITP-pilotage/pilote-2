import type { AnalyticsDimensions } from "@/client/analytics/schema";
import type { AssistantEvent } from "@/components/_commons/ChatUI/useAssistantTracking";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export type PropositionOrigin = {
  id: string;
  mode: NonNullable<AnalyticsDimensions["proposition_mode"]>;
};

export const propositionMode = (
  mode: "send" | "fill",
): PropositionOrigin["mode"] =>
  mode === "send" ? "envoi_direct" : "preremplissage";

// Une proposition préremplie reste à l'origine de la question tant que son
// contenu n'a pas été entièrement effacé.
export const prefilledPropositionAfterEdit = (
  current: PropositionOrigin | undefined,
  input: string,
): PropositionOrigin | undefined => (input.trim() === "" ? undefined : current);

export const questionType = ({
  previousMessages,
  fromProposition,
}: {
  previousMessages: PiloteUIMessage[];
  fromProposition: boolean;
}): NonNullable<AnalyticsDimensions["type_question"]> => {
  if (previousMessages.some((message) => message.role === "assistant"))
    return "suivante";
  return fromProposition ? "premiere_proposition" : "premiere_libre";
};

export const llmCallIdOf = (
  message: PiloteUIMessage | undefined,
): string | undefined =>
  message?.role === "assistant" ? message.metadata?.llmCallId : undefined;

export const lastLlmCallId = (
  messages: PiloteUIMessage[],
): string | undefined => llmCallIdOf(messages.at(-1));

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
