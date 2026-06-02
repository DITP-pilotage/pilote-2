import { useState } from "react";
import { useEnv } from "@/client/hooks/useEnv";
import { récupérerDétailsSurUnTerritoire } from "@/client/constants/territoires";
import { Icone } from "@/components/_commons/Icone";
import { SparklingIcon } from "@/components/_commons/Icones/SparklingIcon";
import { ChatScenarios, ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import { ConversationHistoryDrawer } from "@/components/_commons/ChatUI/ConversationHistoryDrawer";
import Loader from "@/components/_commons/Loader/Loader";
import { ModalePleinEcran } from "@/components/shared/ModalePleinEcran";
import api from "@/server/infrastructure/api/trpc/api";

export const BoutonSyntheseTerritoire = ({
  territoireCode,
  jalon,
  scenarios,
}: {
  territoireCode: string;
  jalon: number;
  scenarios: ChatScenarios;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ffHistorique = useEnv("NEXT_PUBLIC_FF_HISTORIQUE_ALBERT");
  const utilsTrpc = api.useUtils();
  type ConversationActive =
    | { kind: "nouvelle"; id: string }
    | { kind: "existante"; id: string };
  const [conversation, setConversation] = useState<ConversationActive>(() => ({
    kind: "nouvelle",
    id: crypto.randomUUID(),
  }));
  const { data: conversationChargee, isFetched: conversationChargeeFetched } =
    api.albert.conversations.recuperer.useQuery(
      { id: conversation.id },
      {
        enabled:
          ffHistorique === true && isOpen && conversation.kind === "existante",
        retry: false,
      },
    );
  const conversationPrete =
    !ffHistorique ||
    conversation.kind === "nouvelle" ||
    conversationChargeeFetched;
  const selectionnerConversation = (id: string) => {
    setConversation({ kind: "existante", id });
  };
  const demarrerNouvelleConversation = () => {
    setConversation({ kind: "nouvelle", id: crypto.randomUUID() });
  };
  const rafraichirHistorique = () => {
    setConversation((courante) => ({ kind: "existante", id: courante.id }));
    utilsTrpc.albert.conversations.lister.invalidate();
  };

  const territoire = récupérerDétailsSurUnTerritoire(territoireCode);

  return (
    <>
      <button
        className="flex gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Icone className="w-4 h-4" icone={SparklingIcon} />
      </button>

      {isOpen && (
        <ModalePleinEcran
          open={isOpen}
          onOpenChange={setIsOpen}
          title="Synthèse de territoire"
        >
          <div className="flex h-full">
            {ffHistorique ? (
              <ConversationHistoryDrawer
                chatIdCourant={conversation.id}
                onSelectionner={selectionnerConversation}
                onNouvelleConversation={demarrerNouvelleConversation}
              />
            ) : null}
            <div className="flex-1 relative">
              {conversationPrete ? (
                <ChatUI
                  key={conversation.id}
                  chatId={conversation.id}
                  initialMessages={conversationChargee?.messages}
                  onChatFinish={ffHistorique ? rafraichirHistorique : undefined}
                  endpoint="/api/albert/chat"
                  className="h-full"
                  placeholder="Posez une question sur ce territoire..."
                  scenarios={scenarios}
                  agentContext={{
                    jalon,
                    territoireCode,
                    instructions: `Le territoire courant de l'utilisateur est ${territoire.nomAffiché} (code : ${territoireCode}). Utilise ce territoire par défaut lorsque l'utilisateur ne précise pas de territoire dans sa question.`,
                  }}
                />
              ) : (
                <Loader />
              )}
            </div>
          </div>
        </ModalePleinEcran>
      )}
    </>
  );
};
