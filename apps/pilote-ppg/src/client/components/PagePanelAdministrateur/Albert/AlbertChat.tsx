import { useState } from "react";
import { ChatScenarios, ChatUI } from "@/components/_commons/ChatUI/ChatUI";
import { createAlbertConversation } from "@/components/_commons/ChatUI/createAlbertConversation";
import { AlarmWarningIcon } from "@/components/_commons/Icones/AlarmWarningIcon";
import { AlignLeftIcon } from "@/components/_commons/Icones/AlignLeftIcon";
import { ErrorWarningIcon } from "@/components/_commons/Icones/ErrorWarningIcon";

const scenarios: ChatScenarios = {
  kind: "flat",
  scenarios: [
    {
      label: "Synthèse d'un territoire",
      message: "Fais moi la synthèse de ",
      mode: "fill",
      icone: AlignLeftIcon,
    },
    {
      label: "Chantiers en retard",
      message: "Quels sont les chantiers en retard sur ",
      mode: "fill",
      icone: ErrorWarningIcon,
    },
    {
      label: "Chantiers en difficulté",
      message: "Quels sont les chantiers en difficulté sur ",
      mode: "fill",
      icone: AlarmWarningIcon,
    },
  ],
};

export const AlbertChat = () => {
  const [conversation] = useState(() =>
    createAlbertConversation({ id: crypto.randomUUID() }),
  );

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Albert</h2>
      <p className="text-sm text-gray-500 mb-4">
        Interrogez Albert sur les chantiers et leurs synthèses de résultats.
      </p>
      <ChatUI
        conversation={conversation}
        placeholder="Posez votre question sur un chantier..."
        scenarios={scenarios}
      />
    </div>
  );
};
