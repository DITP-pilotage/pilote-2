import { useMemo, useState } from "react";
import { Popover } from "radix-ui";
import { api } from "@/server/framework/trpc/api";
import { Icone } from "@/components/_commons/Icone";
import { ArrowDownSLineIcon } from "@/components/_commons/Icones/ArrowDownSLineIcon";
import { DeleteIcon } from "@/components/_commons/Icones/DeleteIcon";
import { LoupeContourIcon } from "@/components/_commons/Icones/LoupeContourIcon";
import { useAlbertConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import {
  formaterDateConversation,
  grouperConversationsParPeriode,
} from "@/components/_commons/ChatUI/grouperConversationsParPeriode";
import { clsxm } from "@/utils/clsxm";
import { useNow } from "@/client/hooks/useNow";

const normaliser = (texte: string) =>
  texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

// Comme dans Notion : l'historique s'ouvre depuis le titre de la conversation,
// dans toutes les vues.
export const MenuHistorique = ({
  titre,
  chatIdCourant,
}: {
  titre: string;
  chatIdCourant: string;
}) => {
  const { selectConversation } = useAlbertConversation();
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const { data: conversations = [], refetch } =
    api.albert.conversations.lister.useQuery(undefined, { enabled: ouvert });
  const supprimer = api.albert.conversations.supprimer.useMutation({
    onSuccess: () => refetch(),
  });

  const now = useNow();
  const groupes = useMemo(() => {
    const filtre = normaliser(recherche.trim());
    return grouperConversationsParPeriode({
      conversations: filtre
        ? conversations.filter((conversation) =>
            normaliser(conversation.titre).includes(filtre),
          )
        : conversations,
      maintenant: now,
    });
  }, [conversations, now, recherche]);

  const handleSupprimer = (id: string) => {
    if (!confirm("Supprimer cette conversation ?")) return;
    supprimer.mutate({ id });
  };

  return (
    <Popover.Root
      onOpenChange={(estOuvert) => {
        setOuvert(estOuvert);
        if (!estOuvert) setRecherche("");
      }}
      open={ouvert}
    >
      <Popover.Trigger
        className="flex h-8 min-w-0 items-center gap-1.5 px-2 text-left transition-colors hover:bg-dsfr-alt-blue-france data-[state=open]:bg-dsfr-blue-france-950"
        title="Historique des conversations"
      >
        <span className="min-w-0 truncate text-sm font-bold leading-5 text-dsfr-grey-50">
          {titre}
        </span>
        <Icone
          className="h-4 w-4 shrink-0 text-dsfr-grey-200"
          icone={ArrowDownSLineIcon}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          aria-label="Historique des conversations"
          className="z-[1800] flex max-h-[min(480px,70vh)] w-[340px] flex-col border border-dsfr-grey-900 bg-white shadow-lg"
          sideOffset={6}
        >
          <label className="flex shrink-0 items-center gap-2 border-b border-dsfr-grey-925 px-3 py-2.5">
            <Icone
              className="h-4 w-4 shrink-0 text-dsfr-mention-grey"
              icone={LoupeContourIcon}
            />
            <span className="sr-only">Rechercher une conversation</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-dsfr-grey-625"
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Rechercher une conversation"
              type="search"
              value={recherche}
            />
          </label>
          <nav
            aria-label="Conversations"
            className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2"
          >
            {groupes.length === 0 ? (
              <p className="mb-0 px-2.5 py-3 text-xs text-dsfr-mention-grey">
                {recherche
                  ? "Aucune conversation trouvée."
                  : "Aucune conversation."}
              </p>
            ) : null}
            {groupes.map((groupe) => (
              <div key={groupe.libelle}>
                <p className="mb-0 px-2.5 pb-1.5 pt-3 text-xs font-bold leading-4 text-dsfr-mention-grey">
                  {groupe.libelle}
                </p>
                {groupe.conversations.map((conversation) => {
                  const estActive = conversation.id === chatIdCourant;
                  return (
                    <div
                      className={clsxm(
                        "group flex h-9 items-center gap-1 pl-2.5 pr-1",
                        estActive
                          ? "bg-dsfr-blue-france-950 text-primary"
                          : "text-dsfr-grey-50 hover:bg-dsfr-grey-1000",
                      )}
                      key={conversation.id}
                    >
                      <button
                        aria-current={estActive ? "true" : undefined}
                        className="flex h-full min-w-0 flex-1 items-center gap-2 bg-transparent text-left hover:bg-transparent"
                        onClick={() => {
                          setOuvert(false);
                          if (!estActive) selectConversation(conversation.id);
                        }}
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
                        <span className="shrink-0 pr-1.5 text-xs leading-4 text-dsfr-mention-grey group-focus-within:hidden group-hover:hidden">
                          {formaterDateConversation({
                            date: conversation.updatedAt,
                            maintenant: now,
                          })}
                        </span>
                      </button>
                      <button
                        aria-label="Supprimer la conversation"
                        className="hidden h-7 w-7 shrink-0 items-center justify-center bg-transparent text-dsfr-mention-grey hover:bg-dsfr-grey-925 hover:text-error group-focus-within:flex group-hover:flex"
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
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
