import type { ChatScenarios } from "@/components/_commons/ChatUI/ChatEmptyState";
import type { AlbertAgentContext } from "@/components/_commons/ChatUI/createAlbertConversation";

type ContexteConversation = {
  agentContext?: AlbertAgentContext;
  scenarios?: ChatScenarios;
};

/**
 * Tant qu'aucun message n'est parti, la conversation suit la page : l'agent
 * n'a encore rien répondu dans l'ancien contexte. Ensuite, elle le garde, car
 * l'historique en dépend.
 *
 * Retourne le contexte à appliquer, ou null s'il n'y a rien à changer.
 */
export const contexteAAppliquer = ({
  conversation,
  nombreMessages,
  page,
}: {
  conversation: ContexteConversation;
  nombreMessages: number;
  page: ContexteConversation | null;
}): ContexteConversation | null => {
  if (nombreMessages > 0) return null;

  const agentContext = page?.agentContext;
  const scenarios = page?.scenarios;
  if (
    conversation.agentContext === agentContext &&
    conversation.scenarios === scenarios
  )
    return null;

  return { agentContext, scenarios };
};
