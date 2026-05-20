import { useEffect } from "react";
import api from "@/server/infrastructure/api/trpc/api";
import { ConversationTranscript } from "@/components/PagePanelAdministrateur/Albert/ConversationTranscript";

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

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const nbPouce =
    data?.llmCalls.filter((call) => call.evaluation === "POSITIVE").length ?? 0;
  const nbPouceBas =
    data?.llmCalls.filter((call) => call.evaluation === "NEGATIVE").length ?? 0;

  return (
    <div
      aria-modal="true"
      className="!fixed !inset-0 !z-50 !flex !items-center !justify-center !p-4"
      role="dialog"
    >
      <button
        aria-label="Fermer la modale"
        className="!absolute !inset-0 !bg-black/40 !cursor-default"
        onClick={onClose}
        type="button"
      />
      <div className="!relative !bg-white !rounded-lg !shadow-xl !w-full !max-w-3xl !max-h-[90vh] !flex !flex-col">
        <header className="!flex !items-start !justify-between !border-b !border-gray-200 !px-6 !py-4">
          <div className="!min-w-0">
            <h3 className="!text-lg !font-bold !text-gray-900 !truncate">
              {data?.titre || "Sans titre"}
            </h3>
            {data && (
              <>
                <div className="!text-sm !text-gray-600 !mt-1">
                  {data.utilisateur.prenom} {data.utilisateur.nom} ·{" "}
                  <span className="!text-gray-500">
                    {data.utilisateur.email}
                  </span>{" "}
                  ·{" "}
                  <span className="!inline-block !px-2 !py-0.5 !text-xs !bg-gray-100 !rounded">
                    {data.utilisateur.profilNom}
                  </span>
                </div>
                <div className="!text-xs !text-gray-500 !mt-2">
                  Créé le {formatterDateLongue(data.createdAt)} · Mis à jour le{" "}
                  {formatterDateLongue(data.updatedAt)} · {data.llmCalls.length}{" "}
                  tour(s) · {nbPouce} 👍 · {nbPouceBas} 👎
                </div>
              </>
            )}
          </div>
          <button
            aria-label="Fermer"
            className="!ml-4 !text-gray-500 hover:!text-gray-700 !text-2xl !leading-none"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className="!overflow-y-auto !p-6 !flex-1">
          {isLoading && <div className="!text-gray-500">Chargement…</div>}
          {!isLoading && !data && (
            <div className="!text-gray-500">Conversation introuvable.</div>
          )}
          {!isLoading && data && (
            <ConversationTranscript
              llmCalls={data.llmCalls}
              messages={data.messages}
            />
          )}
        </div>
      </div>
    </div>
  );
};
