import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { $Enums } from "@prisma/client";
import { useCurrentApplication } from "@/client/hooks/useCurrentApplication";
import { ChatExperimentationBanner } from "@/components/_commons/ChatUI/ChatExperimentationBanner";
import { ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import { ConversationHistoryDrawer } from "@/components/_commons/ChatUI/ConversationHistoryDrawer";
import { AlbertDock } from "@/components/_commons/ChatUI/AlbertDock";
import { AlbertEnTete } from "@/components/_commons/ChatUI/AlbertEnTete";
import { AlbertFenetre } from "@/components/_commons/ChatUI/AlbertFenetre";
import { AlbertLanceur } from "@/components/_commons/ChatUI/AlbertLanceur";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { NOM_ASSISTANT } from "@/components/_commons/ChatUI/libellesAssistant";
import { versContexteAffiche } from "@/components/_commons/ChatUI/versContexteAffiche";
import { api } from "@/server/framework/trpc/api";

const ConversationHistory = ({ chatId }: { chatId: string }) => {
  const { selectConversation, startNewConversation } = useAlbertConversation();

  return (
    <ConversationHistoryDrawer
      chatIdCourant={chatId}
      onNouvelleConversation={startNewConversation}
      onSelectionner={selectConversation}
    />
  );
};

// ⌘K / Ctrl+K ouvre l'assistant depuis n'importe quelle page, ou reprend la
// conversation réduite.
const useRaccourciOuverture = ({ actif }: { actif: boolean }) => {
  const { conversation, display, open, restore } = useAlbertConversation();

  useEffect(() => {
    if (!actif) return;

    const ouvrir = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k") return;
      if (!(event.metaKey || event.ctrlKey)) return;
      if (conversation && display !== "minimized") return;

      event.preventDefault();
      if (conversation) restore();
      else open();
    };

    window.addEventListener("keydown", ouvrir);
    return () => window.removeEventListener("keydown", ouvrir);
  }, [actif, conversation, display, open, restore]);
};

// Le panneau latéral fait partie de la mise en page (AlbertPanneauLateral) :
// il n'est pas rendu ici.
export const AlbertOverlay = () => {
  const { conversation, display, pageContext, open, close, minimize } =
    useAlbertConversation();
  const estPiloteEval =
    useCurrentApplication() === $Enums.application_accessible.PILOTE_EVAL;
  const { data: acces } = api.albertAccess.monAcces.useQuery(undefined, {
    staleTime: Infinity,
  });
  const peutOuvrir = !estPiloteEval && (acces?.peutUtiliser ?? false);

  useRaccourciOuverture({ actif: peutOuvrir });

  if (!conversation) {
    return peutOuvrir ? (
      <AlbertLanceur
        contexte={versContexteAffiche(pageContext?.agentContext)}
        onOuvrir={open}
      />
    ) : null;
  }

  if (display === "minimized") {
    return <AlbertDock conversation={conversation} />;
  }

  if (display === "floating") {
    return <AlbertFenetre conversation={conversation} />;
  }

  if (display !== "modal") return null;

  const contexte = versContexteAffiche(conversation.agentContext);

  // Échap et clic en dehors réduisent la conversation au lieu de la fermer :
  // seul « Fermer » l'abandonne.
  const minimiserAuLieuDeFermer = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    minimize();
  };

  return (
    <Dialog.Root
      onOpenChange={(isOpen) => {
        if (!isOpen) close();
      }}
      open
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-10 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-4 z-10 flex flex-col border border-dsfr-grey-900 bg-white shadow-md focus:outline-none"
          onEscapeKeyDown={minimiserAuLieuDeFermer}
          onInteractOutside={minimiserAuLieuDeFermer}
        >
          <AlbertEnTete
            compact={false}
            contexte={contexte}
            titre={
              <Dialog.Title className="mb-0 text-base font-bold leading-5 text-dsfr-grey-50">
                {NOM_ASSISTANT}
              </Dialog.Title>
            }
          />
          <div className="flex min-h-0 flex-1">
            <ConversationHistory chatId={conversation.chat.id} />
            <div className="relative min-w-0 flex-1">
              <ChatUI
                className="h-full"
                contexteAccueil={contexte}
                conversation={conversation}
                key={conversation.chat.id}
                placeholder={
                  contexte
                    ? "Posez une question sur ce territoire..."
                    : undefined
                }
                scenarios={conversation.scenarios}
                tracked
              />
            </div>
          </div>
          <ChatExperimentationBanner />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
