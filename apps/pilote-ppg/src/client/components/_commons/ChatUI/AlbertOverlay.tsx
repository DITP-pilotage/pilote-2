import { useEnv } from "@/client/hooks/useEnv";
import { ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import { ConversationHistoryDrawer } from "@/components/_commons/ChatUI/ConversationHistoryDrawer";
import { ModalePleinEcran } from "@/components/shared/ModalePleinEcran";
import { AlbertDock } from "@/components/_commons/ChatUI/AlbertDock";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";

// Isolated in its own component: useEnv relies on useSuspenseQuery and must
// only suspend the content of an open modal, never the whole application.
const ConversationHistory = ({ chatId }: { chatId: string }) => {
  const isHistoryEnabled = useEnv("NEXT_PUBLIC_FF_HISTORIQUE_ALBERT");
  const { selectConversation, startNewConversation } = useAlbertConversation();

  if (!isHistoryEnabled) return null;

  return (
    <ConversationHistoryDrawer
      chatIdCourant={chatId}
      onNouvelleConversation={startNewConversation}
      onSelectionner={selectConversation}
    />
  );
};

export const AlbertOverlay = () => {
  const { conversation, display, close, minimize } = useAlbertConversation();

  if (!conversation) return null;

  if (display === "minimized") {
    return <AlbertDock conversation={conversation} />;
  }

  return (
    <ModalePleinEcran
      onMinimize={minimize}
      onOpenChange={(isOpen) => {
        if (!isOpen) close();
      }}
      open
      title="Synthèse de territoire"
    >
      <div className="flex h-full">
        <ConversationHistory chatId={conversation.chat.id} />
        <div className="relative flex-1">
          <ChatUI
            className="h-full"
            conversation={conversation}
            key={conversation.chat.id}
            placeholder="Posez une question sur ce territoire..."
            scenarios={conversation.scenarios}
            showExperimentationBanner
          />
        </div>
      </div>
    </ModalePleinEcran>
  );
};
