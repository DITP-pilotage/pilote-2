import { Icone } from "@/components/_commons/Icone";
import { MapPin2Icon } from "@/components/_commons/Icones/MapPin2Icon";
import { TimeIcon } from "@/components/_commons/Icones/TimeIcon";
import { AlbertEnTete } from "@/components/_commons/ChatUI/AlbertEnTete";
import {
  useAlbertConversation,
  type CurrentConversation,
} from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { ChatExperimentationBanner } from "@/components/_commons/ChatUI/ChatExperimentationBanner";
import { ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import { NOM_ASSISTANT } from "@/components/_commons/ChatUI/libellesAssistant";
import { versContexteAffiche } from "@/components/_commons/ChatUI/versContexteAffiche";

// Contenu de la fenêtre flottante et du panneau latéral : seul leur cadre
// diffère.
export const AlbertVueCompacte = ({
  conversation,
  idTitre,
}: {
  conversation: CurrentConversation;
  idTitre: string;
}) => {
  const { ouvrirHistorique } = useAlbertConversation();
  const contexte = versContexteAffiche(conversation.agentContext);

  return (
    <>
      <AlbertEnTete
        compact
        contexte={contexte}
        titre={
          <h2
            className="mb-0 min-w-0 truncate text-sm font-bold leading-5 text-dsfr-grey-50"
            id={idTitre}
          >
            {NOM_ASSISTANT}
          </h2>
        }
      />
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
        <button
          className="inline-flex h-7 shrink-0 items-center gap-1 px-1.5 text-xs font-medium text-primary transition-colors hover:bg-dsfr-alt-blue-france"
          onClick={ouvrirHistorique}
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
        tracked
      />
      <ChatExperimentationBanner compact />
    </>
  );
};
