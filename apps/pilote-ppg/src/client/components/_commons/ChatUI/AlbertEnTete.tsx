import { useChat } from "@ai-sdk/react";
import { useMemo } from "react";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { Icone } from "@/components/_commons/Icone";
import { ChatNewLineIcon } from "@/components/_commons/Icones/ChatNewLineIcon";
import { Database2LineIcon } from "@/components/_commons/Icones/Database2LineIcon";
import { DoubleChevronDroiteIcon } from "@/components/_commons/Icones/DoubleChevronDroiteIcon";
import { SubtractLineIcon } from "@/components/_commons/Icones/SubtractLineIcon";
import { AlbertMonogramme } from "@/components/_commons/ChatUI/AlbertMonogramme";
import {
  useAlbertConversation,
  type CurrentConversation,
} from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { MenuHistorique } from "@/components/_commons/ChatUI/MenuHistorique";
import { MenuVue } from "@/components/_commons/ChatUI/MenuVue";
import { donneesDuContexte } from "@/components/_commons/ChatUI/donneesDuContexte";
import { clsxm } from "@/utils/clsxm";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { deriverTitre } from "@/server/albert/domain/ChatConversation";

const BOUTON_ICONE =
  "flex h-8 w-8 shrink-0 items-center justify-center text-primary transition-colors hover:bg-dsfr-alt-blue-france";

const lireTerritoire = (code: string) =>
  récupérerDétailsSurUnTerritoire(code)?.nomAffiché ?? null;

export const AlbertEnTete = ({
  conversation,
  contexteOuvert,
  onBasculerContexte,
}: {
  conversation: CurrentConversation;
  contexteOuvert: boolean;
  onBasculerContexte: () => void;
}) => {
  const { display, minimize, startNewConversation } = useAlbertConversation();
  const { messages } = useChat<PiloteUIMessage>({ chat: conversation.chat });
  const nombreDonnees = useMemo(
    () => donneesDuContexte({ messages, lireTerritoire }).nombreEntrees,
    [messages],
  );

  return (
    <div className="flex h-12 shrink-0 items-center gap-1 border-b border-dsfr-grey-900 pl-3 pr-2">
      <AlbertMonogramme className="mr-1" taille="sm" />
      <MenuHistorique
        chatIdCourant={conversation.chat.id}
        titre={deriverTitre(messages)}
      />
      <span className="min-w-2 flex-1" />
      <button
        aria-label={
          contexteOuvert
            ? "Masquer le contexte de l'assistant"
            : "Afficher le contexte de l'assistant"
        }
        aria-pressed={contexteOuvert}
        className={clsxm(
          BOUTON_ICONE,
          "relative",
          contexteOuvert && "bg-dsfr-blue-france-925",
        )}
        onClick={onBasculerContexte}
        title="Contexte de l'assistant"
        type="button"
      >
        <Icone className="h-[18px] w-[18px]" icone={Database2LineIcon} />
        {nombreDonnees > 0 ? (
          <span className="absolute right-0 top-0.5 min-w-3.5 bg-primary px-[3px] text-center text-[10px] font-bold leading-[14px] text-white">
            {nombreDonnees}
          </span>
        ) : null}
      </button>
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
