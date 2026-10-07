import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { FullscreenLineIcon } from "@/components/_commons/Icones/FullscreenLineIcon";
import { MapPin2Icon } from "@/components/_commons/Icones/MapPin2Icon";
import { SubtractLineIcon } from "@/components/_commons/Icones/SubtractLineIcon";
import { TimeIcon } from "@/components/_commons/Icones/TimeIcon";
import { AlbertMonogramme } from "@/components/_commons/ChatUI/AlbertMonogramme";
import { ChatExperimentationBanner } from "@/components/_commons/ChatUI/ChatExperimentationBanner";
import { ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import type { ContexteAccueil } from "@/components/_commons/ChatUI/ChatEmptyState";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import type { CurrentConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { NOM_ASSISTANT } from "@/components/_commons/ChatUI/libellesAssistant";

const BOUTON_ICONE =
  "flex h-8 w-8 items-center justify-center text-primary transition-colors hover:bg-dsfr-alt-blue-france";

// Fenêtre non modale : la page reste utilisable derrière, et la conversation
// suit la navigation.
export const AlbertFenetre = ({
  conversation,
  contexte,
}: {
  conversation: CurrentConversation;
  contexte?: ContexteAccueil;
}) => {
  const { expand, minimize, close } = useAlbertConversation();

  return (
    <section
      aria-labelledby="albert-fenetre-titre"
      className="fixed bottom-4 right-4 z-[1750] flex h-[min(640px,calc(100vh-2rem))] w-[min(420px,calc(100vw-2rem))] flex-col border border-dsfr-grey-900 bg-white shadow-lg print:hidden"
    >
      <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-dsfr-grey-900 pl-3.5 pr-1.5">
        <AlbertMonogramme taille="sm" />
        <h2
          className="!mb-0 min-w-0 flex-1 truncate !text-sm font-bold leading-5 !text-dsfr-grey-50"
          id="albert-fenetre-titre"
        >
          {NOM_ASSISTANT}
        </h2>
        <button
          aria-label="Agrandir en plein écran"
          className={BOUTON_ICONE}
          onClick={expand}
          title="Agrandir"
          type="button"
        >
          <Icone className="h-[18px] w-[18px]" icone={FullscreenLineIcon} />
        </button>
        <button
          aria-label="Réduire la conversation"
          className={BOUTON_ICONE}
          onClick={minimize}
          title="Réduire"
          type="button"
        >
          <Icone className="h-[18px] w-[18px]" icone={SubtractLineIcon} />
        </button>
        <button
          aria-label={`Fermer l'${NOM_ASSISTANT}`}
          className={BOUTON_ICONE}
          onClick={close}
          title="Fermer"
          type="button"
        >
          <Icone className="h-[18px] w-[18px]" icone={CloseLineIcon} />
        </button>
      </div>
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-dsfr-grey-950 px-3.5">
        {contexte ? (
          <span className="inline-flex h-6 min-w-0 items-center gap-1.5 border border-dsfr-blue-france-925 bg-dsfr-blue-france-950 px-2 text-xs font-medium leading-4 text-primary">
            <Icone className="h-3.5 w-3.5 shrink-0" icone={MapPin2Icon} />
            <span className="truncate">
              {contexte.territoireNom} · Jalon {contexte.jalon}
            </span>
          </span>
        ) : null}
        <span className="flex-1" />
        {/* L'historique n'a la place de s'afficher qu'en plein écran. */}
        <button
          className="inline-flex h-7 shrink-0 items-center gap-1 px-1.5 text-xs font-medium text-primary transition-colors hover:bg-dsfr-alt-blue-france"
          onClick={expand}
          type="button"
        >
          <Icone className="h-3.5 w-3.5" icone={TimeIcon} />
          Historique
        </button>
      </div>
      <ChatUI
        className="min-h-0 flex-1"
        contexteAccueil={contexte}
        conversation={conversation}
        key={conversation.chat.id}
        placeholder={
          contexte ? "Posez une question sur ce territoire..." : undefined
        }
        scenarios={conversation.scenarios}
      />
      <ChatExperimentationBanner compact />
    </section>
  );
};
