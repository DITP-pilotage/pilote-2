import api from "@/server/infrastructure/api/trpc/api";
import { ConversationTranscript } from "@/components/PagePanelAdministrateur/Albert/ConversationTranscript";
import { ModalePleinEcran } from "@/components/shared/ModalePleinEcran";

type ConversationDetailModaleProps = {
  id: string;
  onClose: () => void;
};

const formatterDateLongue = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);

export const ConversationDetailModale = ({
  id,
  onClose,
}: ConversationDetailModaleProps) => {
  const { data, isLoading } = api.albert.admin.recupererConversation.useQuery({
    id,
  });

  const nbPouce =
    data?.llmCalls.filter((call) => call.evaluation === "POSITIVE").length ?? 0;
  const nbPouceBas =
    data?.llmCalls.filter((call) => call.evaluation === "NEGATIVE").length ?? 0;

  return (
    <ModalePleinEcran
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open
      title={data?.titre || "Sans titre"}
    >
      <div className="flex flex-col h-full">
        {data && (
          <div className="px-8 pb-4 border-b border-gray-200">
            <div className="text-sm text-gray-600">
              {data.utilisateur.prenom} {data.utilisateur.nom} ·{" "}
              <span className="text-gray-500">{data.utilisateur.email}</span> ·{" "}
              <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 rounded">
                {data.utilisateur.profilNom}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Créé le {formatterDateLongue(data.createdAt)} · Mis à jour le{" "}
              {formatterDateLongue(data.updatedAt)} · {data.llmCalls.length}{" "}
              tour(s) · {nbPouce} 👍 · {nbPouceBas} 👎
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6">
          {isLoading && <div className="text-gray-500">Chargement…</div>}
          {!isLoading && !data && (
            <div className="text-gray-500">Conversation introuvable.</div>
          )}
          {!isLoading && data && (
            <ConversationTranscript
              llmCalls={data.llmCalls}
              messages={data.messages}
            />
          )}
        </div>
      </div>
    </ModalePleinEcran>
  );
};
