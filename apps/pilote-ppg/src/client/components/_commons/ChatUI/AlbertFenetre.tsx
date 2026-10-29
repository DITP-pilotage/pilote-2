import type { CurrentConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { AlbertContenu } from "@/components/_commons/ChatUI/AlbertContenu";
import { NOM_ASSISTANT } from "@/components/_commons/ChatUI/libellesAssistant";

// Fenêtre non modale : la page reste utilisable derrière, et la conversation
// suit la navigation.
export const AlbertFenetre = ({
  conversation,
}: {
  conversation: CurrentConversation;
}) => (
  <section
    aria-label={NOM_ASSISTANT}
    className="fixed bottom-4 right-4 z-[1750] flex h-[min(56rem,calc(100vh-2rem))] w-[min(440px,calc(100vw-2rem))] flex-col border border-dsfr-grey-900 bg-white shadow-lg print:hidden"
  >
    <AlbertContenu compact conversation={conversation} />
  </section>
);
