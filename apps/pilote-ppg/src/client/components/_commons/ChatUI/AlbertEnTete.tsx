import { useChat } from "@ai-sdk/react";
import { Icone } from "@/components/_commons/Icone";
import { ChatNewLineIcon } from "@/components/_commons/Icones/ChatNewLineIcon";
import { DoubleChevronDroiteIcon } from "@/components/_commons/Icones/DoubleChevronDroiteIcon";
import { SubtractLineIcon } from "@/components/_commons/Icones/SubtractLineIcon";
import { AlbertMonogramme } from "@/components/_commons/ChatUI/AlbertMonogramme";
import {
  useAlbertConversation,
  type CurrentConversation,
} from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { MenuHistorique } from "@/components/_commons/ChatUI/MenuHistorique";
import { MenuVue } from "@/components/_commons/ChatUI/MenuVue";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { deriverTitre } from "@/server/albert/domain/ChatConversation";

const BOUTON_ICONE =
  "flex h-8 w-8 shrink-0 items-center justify-center text-primary transition-colors hover:bg-dsfr-alt-blue-france";

// En-tête commun aux trois vues, comme dans Notion : le titre ouvre
// l'historique, et un seul bouton cache l'assistant. La conversation reste
// alors en bas à droite ; repartir de zéro, c'est en démarrer une nouvelle.
export const AlbertEnTete = ({
  conversation,
}: {
  conversation: CurrentConversation;
}) => {
  const { display, minimize, startNewConversation } = useAlbertConversation();
  const { messages } = useChat<PiloteUIMessage>({ chat: conversation.chat });

  return (
    <div className="flex h-12 shrink-0 items-center gap-1 border-b border-dsfr-grey-900 pl-3 pr-2">
      <AlbertMonogramme className="mr-1" taille="sm" />
      <MenuHistorique
        chatIdCourant={conversation.chat.id}
        titre={deriverTitre(messages)}
      />
      <span className="min-w-2 flex-1" />
      <button
        aria-label="Nouvelle conversation"
        className={BOUTON_ICONE}
        onClick={startNewConversation}
        title="Nouvelle conversation"
        type="button"
      >
        <Icone className="h-[18px] w-[18px]" icone={ChatNewLineIcon} />
      </button>
      <MenuVue />
      <button
        aria-label="Masquer l'assistant"
        className={BOUTON_ICONE}
        onClick={minimize}
        title="Masquer"
        type="button"
      >
        <Icone
          className="h-[18px] w-[18px]"
          icone={
            display === "sidePanel" ? DoubleChevronDroiteIcon : SubtractLineIcon
          }
        />
      </button>
    </div>
  );
};
