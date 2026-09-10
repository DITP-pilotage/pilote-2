import { Dialog } from "radix-ui";
import { useEnv } from "@/client/hooks/useEnv";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { MapPin2Icon } from "@/components/_commons/Icones/MapPin2Icon";
import { SubtractLineIcon } from "@/components/_commons/Icones/SubtractLineIcon";
import { AlbertMonogramme } from "@/components/_commons/ChatUI/AlbertMonogramme";
import { ChatExperimentationBanner } from "@/components/_commons/ChatUI/ChatExperimentationBanner";
import { ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import type { ContexteAccueil } from "@/components/_commons/ChatUI/ChatEmptyState";
import { ConversationHistoryDrawer } from "@/components/_commons/ChatUI/ConversationHistoryDrawer";
import { AlbertDock } from "@/components/_commons/ChatUI/AlbertDock";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";

const BOUTON_ICONE =
  "flex h-8 w-8 items-center justify-center text-primary transition-colors hover:bg-dsfr-alt-blue-france";

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

const AlbertEnTete = ({
  contexte,
  onReduire,
}: {
  contexte: ContexteAccueil;
  onReduire: () => void;
}) => (
  <div className="flex h-14 shrink-0 items-center gap-3 border-b border-dsfr-grey-900 pl-5 pr-4">
    <AlbertMonogramme />
    <Dialog.Title className="!mb-0 !text-base font-bold leading-5 !text-dsfr-grey-50">
      Albert
    </Dialog.Title>
    <span className="ml-2 inline-flex h-7 items-center gap-1.5 border border-dsfr-blue-france-925 bg-dsfr-blue-france-950 px-2.5 text-[13px] font-medium leading-5 text-primary">
      <Icone className="h-4 w-4" icone={MapPin2Icon} />
      {contexte.territoireNom} · Jalon {contexte.jalon}
    </span>
    <span className="flex-1" />
    <button
      aria-label="Réduire la conversation"
      className={BOUTON_ICONE}
      onClick={onReduire}
      title="Réduire"
      type="button"
    >
      <Icone className="h-5 w-5" icone={SubtractLineIcon} />
    </button>
    <Dialog.Close asChild>
      <button
        aria-label="Fermer Albert"
        className={BOUTON_ICONE}
        title="Fermer"
        type="button"
      >
        <Icone className="h-5 w-5" icone={CloseLineIcon} />
      </button>
    </Dialog.Close>
  </div>
);

export const AlbertOverlay = () => {
  const { conversation, display, close, minimize } = useAlbertConversation();

  if (!conversation) return null;

  if (display === "minimized") {
    return <AlbertDock conversation={conversation} />;
  }

  const { territoireCode, jalon } = conversation.agentContext;
  const contexte: ContexteAccueil = {
    territoireNom:
      récupérerDétailsSurUnTerritoire(territoireCode)?.nomAffiché ??
      territoireCode,
    jalon,
  };

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
        <Dialog.Overlay className="fixed inset-0 z-10 !bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-4 z-10 flex flex-col border border-dsfr-grey-900 bg-white shadow-md focus:outline-none"
          onEscapeKeyDown={minimiserAuLieuDeFermer}
          onInteractOutside={minimiserAuLieuDeFermer}
        >
          <AlbertEnTete contexte={contexte} onReduire={minimize} />
          <div className="flex min-h-0 flex-1">
            <ConversationHistory chatId={conversation.chat.id} />
            <div className="relative min-w-0 flex-1">
              <ChatUI
                className="h-full"
                contexteAccueil={contexte}
                conversation={conversation}
                key={conversation.chat.id}
                placeholder="Posez une question sur ce territoire..."
                scenarios={conversation.scenarios}
              />
            </div>
          </div>
          <ChatExperimentationBanner />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
