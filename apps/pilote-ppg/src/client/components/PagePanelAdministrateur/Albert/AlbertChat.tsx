import { useRef } from "react";
import { ChatScenarios, ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import {
  creerConversationAlbert,
  type ConversationAlbert,
} from "@/components/_commons/ChatUI/creerConversationAlbert";

const scenarios: ChatScenarios = {
  kind: "flat",
  scenarios: [
    {
      label: "Synthèse d'un territoire",
      message: "Fais moi la synthèse de ",
      mode: "fill",
    },
    {
      label: "Chantiers en retard",
      message: "Quels sont les chantiers en retard sur ",
      mode: "fill",
    },
    {
      label: "Chantiers en difficulté",
      message: "Quels sont les chantiers en difficulté sur ",
      mode: "fill",
    },
  ],
};

export const AlbertChat = () => {
  const conversationRef = useRef<ConversationAlbert | null>(null);
  conversationRef.current ??= creerConversationAlbert({
    id: crypto.randomUUID(),
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Albert</h2>
      <p className="text-sm text-gray-500 mb-4">
        Interrogez Albert sur les chantiers et leurs synthèses de résultats.
      </p>
      <ChatUI
        conversation={conversationRef.current}
        placeholder="Posez votre question sur un chantier..."
        scenarios={scenarios}
      />
    </div>
  );
};
