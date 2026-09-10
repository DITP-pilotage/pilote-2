import { useChat } from "@ai-sdk/react";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { AlbertMonogramme } from "@/components/_commons/ChatUI/AlbertMonogramme";
import { PointsAttente } from "@/components/_commons/ChatUI/PointsAttente";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import type { AlbertConversation } from "@/components/_commons/ChatUI/createAlbertConversation";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { deriverTitre } from "@/server/albert/domain/ChatConversation";

export const AlbertDock = ({
  conversation,
}: {
  conversation: AlbertConversation;
}) => {
  const { restore, close } = useAlbertConversation();
  const { messages, status } = useChat<PiloteUIMessage>({
    chat: conversation.chat,
  });
  const enCours = status === "submitted" || status === "streaming";

  return (
    <div className="fixed bottom-4 right-4 z-[1750] flex h-12 max-w-[380px] items-center gap-2.5 border border-dsfr-grey-900 bg-white pl-2.5 pr-1.5 shadow-md">
      <AlbertMonogramme taille="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium leading-[18px] text-dsfr-grey-50 fr-mb-0">
          {deriverTitre(messages)}
        </p>
        <p className="flex items-center gap-1.5 text-[11px] leading-[14px] text-dsfr-mention-grey fr-mb-0">
          {enCours ? (
            <>
              <PointsAttente className="[&>span]:h-1 [&>span]:w-1" />
              <span className="text-primary">Albert rédige…</span>
            </>
          ) : (
            "Conversation en pause"
          )}
        </p>
      </div>
      <button
        aria-label="Reprendre la conversation"
        className="fr-btn fr-btn--sm"
        onClick={restore}
        type="button"
      >
        {enCours ? "Voir" : "Reprendre"}
      </button>
      <button
        aria-label="Fermer la conversation"
        className="flex h-8 w-8 items-center justify-center text-dsfr-mention-grey transition-colors hover:bg-dsfr-grey-1000 hover:text-dsfr-grey-50"
        onClick={close}
        type="button"
      >
        <Icone className="h-4 w-4 !text-current" icone={CloseLineIcon} />
      </button>
    </div>
  );
};
