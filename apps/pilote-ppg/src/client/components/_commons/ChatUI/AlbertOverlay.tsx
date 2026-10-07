import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { $Enums } from "@prisma/client";
import { useCurrentApplication } from "@/client/hooks/useCurrentApplication";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { FullscreenExitLineIcon } from "@/components/_commons/Icones/FullscreenExitLineIcon";
import { MapPin2Icon } from "@/components/_commons/Icones/MapPin2Icon";
import { SubtractLineIcon } from "@/components/_commons/Icones/SubtractLineIcon";
import { AlbertMonogramme } from "@/components/_commons/ChatUI/AlbertMonogramme";
import { ChatExperimentationBanner } from "@/components/_commons/ChatUI/ChatExperimentationBanner";
import { ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import type { ContexteAccueil } from "@/components/_commons/ChatUI/ChatEmptyState";
import { ConversationHistoryDrawer } from "@/components/_commons/ChatUI/ConversationHistoryDrawer";
import { AlbertDock } from "@/components/_commons/ChatUI/AlbertDock";
import { AlbertFenetre } from "@/components/_commons/ChatUI/AlbertFenetre";
import { AlbertLanceur } from "@/components/_commons/ChatUI/AlbertLanceur";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import type { AlbertAgentContext } from "@/components/_commons/ChatUI/createAlbertConversation";
import { NOM_ASSISTANT } from "@/components/_commons/ChatUI/libellesAssistant";
import api from "@/server/infrastructure/api/trpc/api";

const BOUTON_ICONE =
  "flex h-8 w-8 items-center justify-center text-primary transition-colors hover:bg-dsfr-alt-blue-france";

const versContexteAffiche = (
  agentContext: AlbertAgentContext | undefined,
): ContexteAccueil | undefined =>
  agentContext && {
    territoireNom:
      récupérerDétailsSurUnTerritoire(agentContext.territoireCode)
        ?.nomAffiché ?? agentContext.territoireCode,
    jalon: agentContext.jalon,
  };

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

const AlbertEnTete = ({
  contexte,
  onFenetre,
  onReduire,
}: {
  contexte?: ContexteAccueil;
  onFenetre: () => void;
  onReduire: () => void;
}) => (
  <div className="flex h-14 shrink-0 items-center gap-3 border-b border-dsfr-grey-900 pl-5 pr-4">
    <AlbertMonogramme />
    <Dialog.Title className="!mb-0 !text-base font-bold leading-5 !text-dsfr-grey-50">
      {NOM_ASSISTANT}
    </Dialog.Title>
    {contexte ? (
      <span className="ml-2 inline-flex h-7 items-center gap-1.5 border border-dsfr-blue-france-925 bg-dsfr-blue-france-950 px-2.5 text-[13px] font-medium leading-5 text-primary">
        <Icone className="h-4 w-4" icone={MapPin2Icon} />
        {contexte.territoireNom} · Jalon {contexte.jalon}
      </span>
    ) : null}
    <span className="flex-1" />
    <button
      className="mr-1 inline-flex h-8 items-center gap-1.5 border border-dsfr-grey-900 px-2.5 text-[13px] font-medium text-primary transition-colors hover:bg-dsfr-alt-blue-france"
      onClick={onFenetre}
      title="Réduire en fenêtre"
      type="button"
    >
      <Icone className="h-4 w-4" icone={FullscreenExitLineIcon} />
      Fenêtre
    </button>
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
        aria-label={`Fermer l'${NOM_ASSISTANT}`}
        className={BOUTON_ICONE}
        title="Fermer"
        type="button"
      >
        <Icone className="h-5 w-5" icone={CloseLineIcon} />
      </button>
    </Dialog.Close>
  </div>
);

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

export const AlbertOverlay = () => {
  const {
    conversation,
    display,
    pageContext,
    open,
    contract,
    close,
    minimize,
  } = useAlbertConversation();
  const estPiloteEval =
    useCurrentApplication() === $Enums.application_accessible.PILOTE_EVAL;
  const { data: acces } = api.albert.acces.useQuery(undefined, {
    staleTime: Infinity,
  });
  const peutOuvrir = !estPiloteEval && (acces?.peutUtiliserAskAI ?? false);

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

  const contexte = versContexteAffiche(conversation.agentContext);

  if (display === "floating") {
    return <AlbertFenetre contexte={contexte} conversation={conversation} />;
  }

  // Échap et clic en dehors repassent en fenêtre au lieu de fermer : seul
  // « Fermer » abandonne la conversation.
  const repasserEnFenetre = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    contract();
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
          onEscapeKeyDown={repasserEnFenetre}
          onInteractOutside={repasserEnFenetre}
        >
          <AlbertEnTete
            contexte={contexte}
            onFenetre={contract}
            onReduire={minimize}
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
              />
            </div>
          </div>
          <ChatExperimentationBanner />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
