import { useEnv } from "@/client/hooks/useEnv";
import { ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import { ConversationHistoryDrawer } from "@/components/_commons/ChatUI/ConversationHistoryDrawer";
import { ModalePleinEcran } from "@/components/shared/ModalePleinEcran";
import { AlbertDock } from "@/components/_commons/ChatUI/AlbertDock";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";

// Isolé dans son propre composant : useEnv s'appuie sur useSuspenseQuery et ne
// doit suspendre que le contenu de la modale ouverte, jamais l'application.
const HistoriqueConversations = ({
  chatIdCourant,
}: {
  chatIdCourant: string;
}) => {
  const ffHistorique = useEnv("NEXT_PUBLIC_FF_HISTORIQUE_ALBERT");
  const { selectionnerConversation, demarrerNouvelleConversation } =
    useAlbertConversation();

  if (!ffHistorique) return null;

  return (
    <ConversationHistoryDrawer
      chatIdCourant={chatIdCourant}
      onNouvelleConversation={demarrerNouvelleConversation}
      onSelectionner={selectionnerConversation}
    />
  );
};

export const AlbertOverlay = () => {
  const { conversation, affichage, fermer } = useAlbertConversation();

  if (!conversation) return null;

  if (affichage === "minimise") {
    return <AlbertDock conversation={conversation} />;
  }

  return (
    <ModalePleinEcran
      onOpenChange={(ouvert) => {
        if (!ouvert) fermer();
      }}
      open
      title="Synthèse de territoire"
    >
      <div className="flex h-full">
        <HistoriqueConversations chatIdCourant={conversation.chat.id} />
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
