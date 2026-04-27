import api from "@/server/infrastructure/api/trpc/api";
import { Icone } from "@/components/_commons/Icone";
import { DeleteIcon } from "@/components/_commons/Icones/DeleteIcon";

type Props = {
  conversationIdCourant: string | null;
  onSelectionner: (id: string) => void;
  onNouvelleConversation: () => void;
};

const formatRelative = (date: Date): string => {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const ConversationHistoryDrawer = ({
  conversationIdCourant,
  onSelectionner,
  onNouvelleConversation,
}: Props) => {
  const { data: conversations = [], refetch } =
    api.albert.conversations.lister.useQuery();
  const supprimer = api.albert.conversations.supprimer.useMutation({
    onSuccess: () => refetch(),
  });

  const handleSupprimer = (id: string) => {
    if (!confirm("Supprimer cette conversation ?")) return;
    supprimer.mutate({ id });
  };

  return (
    <aside className="w-64 h-full border-r border-gray-200 bg-gray-50 flex flex-col">
      <button
        type="button"
        onClick={onNouvelleConversation}
        className="m-3 px-3 py-2 text-sm font-medium bg-primary text-white rounded hover:bg-primary/90"
      >
        + Nouvelle conversation
      </button>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <p className="text-xs text-gray-500 px-3">Aucune conversation.</p>
        )}
        {conversations.map((conversation) => {
          const estActive = conversation.id === conversationIdCourant;
          return (
            <div
              key={conversation.id}
              className={`group flex items-start gap-2 px-3 py-2 text-sm ${
                estActive ? "bg-primary/10" : "hover:bg-gray-100"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectionner(conversation.id)}
                className="flex-1 min-w-0 text-left"
              >
                <p className="truncate font-medium text-gray-900">
                  {conversation.titre}
                </p>
                <p className="text-xs text-gray-500">
                  {formatRelative(conversation.updatedAt)}
                </p>
              </button>
              <button
                type="button"
                aria-label="Supprimer"
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                onClick={() => handleSupprimer(conversation.id)}
              >
                <Icone className="w-4 h-4" icone={DeleteIcon} />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
