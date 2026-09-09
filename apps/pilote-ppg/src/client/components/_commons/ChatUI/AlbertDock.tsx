import { useChat } from "@ai-sdk/react";
import { Icone } from "@/components/_commons/Icone";
import { SparklingIcon } from "@/components/_commons/Icones/SparklingIcon";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
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
  const { messages } = useChat<PiloteUIMessage>({ chat: conversation.chat });

  return (
    <div className="fixed bottom-4 right-4 z-[1750] flex max-w-xs items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <button
        aria-label="Reprendre la conversation"
        className="flex min-w-0 flex-1 items-center gap-2 text-left hover:bg-transparent"
        onClick={restore}
        type="button"
      >
        <Icone
          className="h-4 w-4 shrink-0 !text-primary"
          icone={SparklingIcon}
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-primary">
            Reprendre la conversation
          </span>
          <span className="block truncate text-xs text-gray-500">
            {deriverTitre(messages)}
          </span>
        </span>
      </button>
      <button
        aria-label="Fermer la conversation"
        className="shrink-0 text-gray-400 hover:text-red-500"
        onClick={close}
        type="button"
      >
        <Icone className="h-4 w-4 !text-current" icone={CloseLineIcon} />
      </button>
    </div>
  );
};
