import {
  useAlbertConversation,
  type CurrentConversation,
} from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { memeContexte } from "@/components/_commons/ChatUI/contexteConversation";
import {
  libelleContexte,
  versContexteAffiche,
} from "@/components/_commons/ChatUI/versContexteAffiche";

/**
 * Une conversation commencée garde son contexte quand l'utilisateur change de
 * territoire : ce bandeau rend le décalage visible et propose d'en repartir.
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

  const contexteConversation = versContexteAffiche(conversation.agentContext);

  return (
    <div
      className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-dsfr-blue-france-850 bg-dsfr-info-950 px-4 py-2 text-xs leading-[18px] text-dsfr-grey-200"
      role="status"
    >
      <span className="min-w-0 flex-1">
        Vous consultez{" "}
        <span className="font-medium">{libelleContexte(contextePage)}</span>
        {contexteConversation ? (
          <>
            {" "}
            ; cette conversation porte sur{" "}
            <span className="font-medium">
              {libelleContexte(contexteConversation)}
            </span>
          </>
        ) : null}
        .
      </span>
      <button
        className="whitespace-nowrap font-medium text-primary hover:underline"
        onClick={startNewConversation}
        type="button"
      >
        Nouvelle conversation
      </button>
    </div>
  );
};
