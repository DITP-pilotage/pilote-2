import { ChatUI } from "@/components/_commons/ChatUI/ChatUI";

export const AlbertChat = () => {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Albert</h2>
      <p className="text-sm text-gray-500 mb-4">
        Interrogez Albert sur les chantiers et leurs synthèses de résultats.
      </p>
      <ChatUI
        api="/api/albert/chat"
        emptyStateText="Posez une question pour commencer la conversation."
        placeholder="Posez votre question sur un chantier..."
      />
    </div>
  );
};
