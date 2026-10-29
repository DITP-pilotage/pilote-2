import { useMemo } from "react";
import { Button } from "@/components/shared/Button";
import { api } from "@/server/framework/trpc/api";
import { Icone } from "@/components/_commons/Icone";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";
import { DeleteIcon } from "@/components/_commons/Icones/DeleteIcon";
import {
  formaterDateConversation,
  grouperConversationsParPeriode,
} from "@/components/_commons/ChatUI/grouperConversationsParPeriode";
import { clsxm } from "@/utils/clsxm";
import { useNow } from "@/client/hooks/useNow";

type Props = {
  chatIdCourant: string | null;
  onSelectionner: (id: string) => void;
  onNouvelleConversation: () => void;
};

export const ConversationHistoryDrawer = ({
  chatIdCourant,
  onSelectionner,
  onNouvelleConversation,
}: Props) => {
  const { data: conversations = [], refetch } =
    api.albert.conversations.lister.useQuery();
  const supprimer = api.albert.conversations.supprimer.useMutation({
    onSuccess: () => refetch(),
  });

  const now = useNow();
  const groupes = useMemo(
    () =>
      grouperConversationsParPeriode({
        conversations,
        maintenant: now,
      }),
    [conversations, now],
  );

  const handleSupprimer = (id: string) => {
    if (!confirm("Supprimer cette conversation ?")) return;
    supprimer.mutate({ id });
  };

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-dsfr-grey-900 bg-white">
      <div className="px-2 pb-2 pt-3">
        <Button
          className="w-full justify-start font-medium hover:bg-dsfr-alt-blue-france"
          iconLeft={
            <Icone
              className="h-[18px] w-[18px] text-current"
              icone={AddLineIcon}
            />
          }
          onClick={onNouvelleConversation}
          size="sm"
          variant="tertiary-no-outline"
        >
          Nouvelle conversation
        </Button>
      </div>

      <nav
        aria-label="Historique des conversations"
        className="flex-1 overflow-y-auto px-2 pb-4"
      >
        {conversations.length === 0 && (
          <p className="px-2.5 py-3 text-xs text-dsfr-mention-grey mb-0">
            Aucune conversation.
          </p>
        )}
        {groupes.map((groupe) => (
          <div className="pb-1" key={groupe.libelle}>
            <p className="px-2.5 pb-1.5 pt-4 text-xs font-bold leading-4 text-dsfr-mention-grey mb-0">
              {groupe.libelle}
            </p>
            {groupe.conversations.map((conversation) => {
              const estActive = conversation.id === chatIdCourant;
              return (
                <div
                  className={clsxm(
                    "group flex h-9 items-center gap-1 rounded pl-2.5 pr-1",
                    estActive
                      ? "bg-dsfr-blue-france-950 text-primary"
                      : "text-dsfr-grey-50 hover:bg-dsfr-grey-1000",
                  )}
                  key={conversation.id}
                >
                  <button
                    aria-current={estActive ? "true" : undefined}
                    className="flex h-full min-w-0 flex-1 items-center gap-2 bg-transparent text-left hover:bg-transparent"
                    onClick={() => onSelectionner(conversation.id)}
                    title={conversation.titre}
                    type="button"
                  >
                    <span
                      className={clsxm(
                        "min-w-0 flex-1 truncate text-sm leading-5",
                        estActive && "font-medium",
                      )}
                    >
                      {conversation.titre}
                    </span>
                    <span
                      className={clsxm(
                        "shrink-0 pr-1.5 text-xs leading-4 group-focus-within:hidden group-hover:hidden",
                        estActive ? "text-primary" : "text-dsfr-mention-grey",
                      )}
                    >
                      {formaterDateConversation({
                        date: conversation.updatedAt,
                        maintenant: now,
                      })}
                    </span>
                  </button>
                  <button
                    aria-label="Supprimer la conversation"
                    className="hidden h-7 w-7 shrink-0 items-center justify-center rounded bg-transparent text-dsfr-mention-grey hover:bg-dsfr-grey-925 hover:text-error group-focus-within:flex group-hover:flex"
                    onClick={() => handleSupprimer(conversation.id)}
                    title="Supprimer"
                    type="button"
                  >
                    <Icone
                      className="h-4 w-4 text-current"
                      icone={DeleteIcon}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
};
