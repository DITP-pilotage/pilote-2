import { ChatScenario, ChatUI } from "@/components/_commons/ChatUI/ChatUI";

const scenarios: ChatScenario[] = [
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
];

export const AlbertChat = () => {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Albert</h2>
      <p className="text-sm text-gray-500 mb-4">
        Interrogez Albert sur les chantiers et leurs synthèses de résultats.
      </p>
      <ChatUI
        endpoint="/api/albert/chat"
        placeholder="Posez votre question sur un chantier..."
        scenarios={scenarios}
      />
    </div>
  );
};
