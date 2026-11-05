import { useState } from "react";
import type { CurrentConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { AlbertEnTete } from "@/components/_commons/ChatUI/AlbertEnTete";
import { BandeauChangementContexte } from "@/components/_commons/ChatUI/BandeauChangementContexte";
import { ChatExperimentationBanner } from "@/components/_commons/ChatUI/ChatExperimentationBanner";
import { ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import { PanneauContexte } from "@/components/_commons/ChatUI/PanneauContexte";
import { versContexteAffiche } from "@/components/_commons/ChatUI/versContexteAffiche";
import { clsxm } from "@/utils/clsxm";

export const AlbertContenu = ({
  conversation,
  compact,
}: {
  conversation: CurrentConversation;
  compact: boolean;
}) => {
  const contexte = versContexteAffiche(conversation.agentContext);
  const [contexteOuvert, setContexteOuvert] = useState(false);
  // Étroit, le panneau remplace la conversation : celle-ci reste montée,
  // masquée, pour garder son défilement et le flux en cours.
  const remplaceLaConversation = contexteOuvert && compact;

  return (
    <>
      <AlbertEnTete
        contexteOuvert={contexteOuvert}
        conversation={conversation}
        onBasculerContexte={() => setContexteOuvert((ouvert) => !ouvert)}
      />
      <BandeauChangementContexte conversation={conversation} />
      <div className="flex min-h-0 flex-1">
        <ChatUI
          className={clsxm(
            "min-h-0 min-w-0 flex-1",
            remplaceLaConversation && "hidden",
          )}
          contexteAccueil={contexte}
          conversation={conversation}
          key={conversation.chat.id}
          placeholder={
            contexte?.chantierId
              ? "Posez une question sur ce chantier..."
              : contexte
                ? "Posez une question sur ce territoire..."
                : undefined
          }
          scenarios={conversation.scenarios}
          tracked
        />
        {contexteOuvert ? (
          <PanneauContexte
            className={
              compact
                ? "min-w-0 flex-1"
                : "w-[380px] shrink-0 border-l border-dsfr-grey-900"
            }
            conversation={conversation}
            onFermer={() => setContexteOuvert(false)}
            retourConversation={compact}
          />
        ) : null}
      </div>
      <ChatExperimentationBanner compact={compact} />
    </>
  );
};
