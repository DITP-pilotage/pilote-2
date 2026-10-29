import type { CurrentConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { AlbertVueCompacte } from "@/components/_commons/ChatUI/AlbertVueCompacte";

// Fenêtre non modale : la page reste utilisable derrière, et la conversation
// suit la navigation.
export const AlbertFenetre = ({
  conversation,
}: {
  conversation: CurrentConversation;
}) => (
  <section
    aria-labelledby="albert-fenetre-titre"
    className="fixed bottom-4 right-4 z-[1750] flex h-[min(56rem,calc(100vh-2rem))] w-[min(440px,calc(100vw-2rem))] flex-col border border-dsfr-grey-900 bg-white shadow-lg print:hidden"
  >
    <AlbertVueCompacte
      conversation={conversation}
      idTitre="albert-fenetre-titre"
    />
  </section>
);
