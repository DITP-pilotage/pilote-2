import {
  useAlbertConversation,
  type CurrentConversation,
} from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { memeContexte } from "@/components/_commons/ChatUI/contexteConversation";
import {
  differenceDeContexte,
  versContexteAffiche,
} from "@/components/_commons/ChatUI/versContexteAffiche";
import { Icone } from "@/components/_commons/Icone";
import { MapPin2Icon } from "@/components/_commons/Icones/MapPin2Icon";

/**
 * Une conversation commencée garde son contexte quand l'utilisateur change de
 * territoire : ce bandeau rend le décalage visible et propose d'en repartir.
 * Il ne nomme que ce qui diffère entre la conversation et la page.
 */
export const BandeauChangementContexte = ({
  conversation,
}: {
  conversation: CurrentConversation;
}) => {
  const { pageContext, startNewConversation } = useAlbertConversation();
  const contextePage = versContexteAffiche(pageContext?.agentContext);

  // Une conversation vide suit déjà la page.
  if (!contextePage || conversation.chat.messages.length === 0) return null;
  if (
    memeContexte({
      conversation: conversation.agentContext,
      page: pageContext?.agentContext,
    })
  )
    return null;

  const difference = differenceDeContexte({
    conversation: versContexteAffiche(conversation.agentContext),
    page: contextePage,
  });

  return (
    <div
      className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-dsfr-grey-925 bg-dsfr-blue-france-950 px-4 py-2 text-xs leading-[18px] text-dsfr-grey-200"
      role="status"
    >
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <Icone
          className="h-3.5 w-3.5 shrink-0 text-primary"
          icone={MapPin2Icon}
        />
        {difference.conversation ? (
          <span>
            Cette conversation porte sur{" "}
            <strong className="font-medium text-dsfr-grey-50">
              {difference.conversation}
            </strong>
          </span>
        ) : (
          <span>Cette conversation ne porte sur aucun territoire</span>
        )}
      </span>
      <button
        className="shrink-0 border border-primary bg-white px-2 py-1 font-medium text-primary transition-colors hover:bg-dsfr-alt-blue-france"
        onClick={startNewConversation}
        type="button"
      >
        Nouvelle conversation sur {difference.page}
      </button>
    </div>
  );
};
