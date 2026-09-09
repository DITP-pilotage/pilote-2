import { useMemo } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { AddLineIcon } from "@/components/_commons/Icones/AddLineIcon";
import { DeleteIcon } from "@/components/_commons/Icones/DeleteIcon";
import {
  formaterDateConversation,
  grouperConversationsParPeriode,
} from "@/components/_commons/ChatUI/grouperConversationsParPeriode";
import { clsxm } from "@/utils/clsxm";

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

  const groupes = useMemo(
    () =>
      grouperConversationsParPeriode({
        conversations,
        maintenant: new Date(),
      }),
    [conversations],
  );

  const handleSupprimer = (id: string) => {
    if (!confirm("Supprimer cette conversation ?")) return;
    supprimer.mutate({ id });
  };

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-dsfr-grey-900 bg-white">
      <Bouton
        className="mx-3 mb-1 mt-3 justify-start"
        iconLeft={
          <Icone className="h-4 w-4 !text-current" icone={AddLineIcon} />
        }
        label="Nouvelle conversation"
        onClick={onNouvelleConversation}
        size="sm"
        variant="secondary"
      />

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <p className="px-4 py-3 text-xs text-dsfr-mention-grey fr-mb-0">
            Aucune conversation.
          </p>
        )}
        {groupes.map((groupe) => (
          <div key={groupe.libelle}>
            <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-dsfr-mention-grey fr-mb-0">
              {groupe.libelle}
            </p>
            {groupe.conversations.map((conversation) => {
              const estActive = conversation.id === chatIdCourant;
              return (
                <div
                  className={clsxm(
                    "group flex items-start gap-2 border-l-[3px] py-2 pl-4 pr-3 text-sm",
                    estActive
                      ? "border-l-primary bg-dsfr-blue-france-950"
                      : "border-l-transparent hover:bg-dsfr-grey-1000",
                  )}
                  key={conversation.id}
                >
                  <button
                    className="min-w-0 flex-1 text-left hover:bg-transparent"
                    onClick={() => onSelectionner(conversation.id)}
                    type="button"
                  >
                    <p className="truncate font-medium leading-5 text-dsfr-grey-50 fr-mb-0">
                      {conversation.titre}
                    </p>
                    <p className="text-xs leading-[18px] text-dsfr-mention-grey fr-mb-0">
                      {formaterDateConversation({
                        date: conversation.updatedAt,
                        maintenant: new Date(),
                      })}
                    </p>
                  </button>
                  <button
                    aria-label="Supprimer"
                    className="mt-0.5 text-dsfr-grey-625 opacity-0 hover:text-error focus:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
                    onClick={() => handleSupprimer(conversation.id)}
                    type="button"
                  >
                    <Icone
                      className="h-4 w-4 !text-current"
                      icone={DeleteIcon}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
};
