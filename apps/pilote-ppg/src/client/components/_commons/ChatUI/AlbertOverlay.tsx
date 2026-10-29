import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { $Enums } from "@prisma/client";
import { useCurrentApplication } from "@/client/hooks/useCurrentApplication";
import { AlbertContenu } from "@/components/_commons/ChatUI/AlbertContenu";
import { AlbertFenetre } from "@/components/_commons/ChatUI/AlbertFenetre";
import { AlbertPastille } from "@/components/_commons/ChatUI/AlbertPastille";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { NOM_ASSISTANT } from "@/components/_commons/ChatUI/libellesAssistant";
import { api } from "@/server/framework/trpc/api";

// ⌘K / Ctrl+K ouvre l'assistant depuis n'importe quelle page, ou reprend la
// conversation masquée.
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
  const { conversation, display, open, minimize } = useAlbertConversation();
  const estPiloteEval =
    useCurrentApplication() === $Enums.application_accessible.PILOTE_EVAL;
  const { data: acces } = api.albertAccess.monAcces.useQuery(undefined, {
    staleTime: Infinity,
  });
  const peutOuvrir = !estPiloteEval && (acces?.peutUtiliser ?? false);

  useRaccourciOuverture({ actif: peutOuvrir });

  if (!conversation || display === "minimized") {
    // Une conversation masquée reste accessible ; sans conversation, la
    // pastille n'est proposée qu'aux utilisateurs autorisés.
    return conversation || peutOuvrir ? (
      <AlbertPastille conversation={conversation} onOuvrir={open} />
    ) : null;
  }

  if (display === "floating") {
    return <AlbertFenetre conversation={conversation} />;
  }

  if (display !== "modal") return null;

  // Échap masque l'assistant au lieu de le fermer : la conversation reste en
  // bas à droite.
  const masquer = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    minimize();
  };

  return (
    <Dialog.Root
      onOpenChange={(isOpen) => {
        if (!isOpen) minimize();
      }}
      open
    >
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[1760] flex flex-col bg-white focus:outline-none"
          onEscapeKeyDown={masquer}
        >
          <Dialog.Title className="sr-only">{NOM_ASSISTANT}</Dialog.Title>
          <AlbertContenu compact={false} conversation={conversation} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
