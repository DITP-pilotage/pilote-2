import type { CurrentConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { AlbertEnTete } from "@/components/_commons/ChatUI/AlbertEnTete";
import { ChatExperimentationBanner } from "@/components/_commons/ChatUI/ChatExperimentationBanner";
import { ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import { versContexteAffiche } from "@/components/_commons/ChatUI/versContexteAffiche";

// Contenu des trois vues : seul leur cadre diffère.
export const AlbertContenu = ({
  conversation,
  compact,
}: {
  conversation: CurrentConversation;
  compact: boolean;
}) => {
  const contexte = versContexteAffiche(conversation.agentContext);

  return (
    <>
      <AlbertEnTete conversation={conversation} />
      <ChatUI
        className="min-h-0 flex-1"
        contexteAccueil={contexte}
        conversation={conversation}
        key={conversation.chat.id}
        placeholder={
          contexte ? "Posez une question sur ce territoire..." : undefined
        }
        scenarios={conversation.scenarios}
        tracked
      />
      <ChatExperimentationBanner compact={compact} />
    </>
  );
};
