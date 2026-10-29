import type { ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { Icone } from "@/components/_commons/Icone";
import { SparklingIcon } from "@/components/_commons/Icones/SparklingIcon";
import { LoadingDots } from "@/components/shared/LoadingDots";
import {
  useAlbertConversation,
  type CurrentConversation,
} from "@/components/_commons/ChatUI/AlbertConversationProvider";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { deriverTitre } from "@/server/albert/domain/ChatConversation";
import { clsxm } from "@/utils/clsxm";

const estMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent);

// Un rond aux étoiles, qui s'étire pour dire quoi faire : au survol, au focus
// clavier, et tant que l'assistant rédige une réponse.
const Pastille = ({
  etiree,
  avecPoint,
  onClick,
  children,
}: {
  etiree: boolean;
  avecPoint: boolean;
  onClick: () => void;
  children: ReactNode;
}) => {
  const mac = estMac();

  return (
    <button
      aria-keyshortcuts={mac ? "Meta+K" : "Control+K"}
      className="group fixed bottom-6 right-6 z-[1750] flex h-12 min-w-12 items-center rounded-full bg-primary px-[13px] text-left text-white shadow-lg transition-colors hover:bg-dsfr-blue-france-sun-113-hover print:hidden"
      onClick={onClick}
      type="button"
    >
      <span className="relative flex shrink-0">
        <Icone className="h-[22px] w-[22px] text-white" icone={SparklingIcon} />
        {avecPoint ? (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-white ring-2 ring-primary group-hover:hidden group-focus-visible:hidden"
          />
        ) : null}
      </span>
      <span
        className={clsxm(
          "flex items-center gap-2 overflow-hidden whitespace-nowrap transition-all duration-200",
          etiree
            ? "ml-2 max-w-[280px] opacity-100"
            : "max-w-0 opacity-0 group-hover:ml-2 group-hover:max-w-[280px] group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-[280px] group-focus-visible:opacity-100",
        )}
      >
        {children}
      </span>
    </button>
  );
};

const PastilleDemander = ({ onClick }: { onClick: () => void }) => (
  <Pastille avecPoint={false} etiree={false} onClick={onClick}>
    <span className="text-sm font-medium">Demander à l&apos;assistant</span>
    <kbd
      aria-hidden="true"
      className="rounded border border-white/50 px-1.5 py-px font-[inherit] text-[11px] leading-4"
    >
      {estMac() ? "⌘K" : "Ctrl K"}
    </kbd>
  </Pastille>
);

const PastilleConversation = ({
  conversation,
}: {
  conversation: CurrentConversation;
}) => {
  const { restore } = useAlbertConversation();
  const { messages, status } = useChat<PiloteUIMessage>({
    chat: conversation.chat,
  });
  const enCours = status === "submitted" || status === "streaming";
  const titre = deriverTitre(messages);

  if (enCours) {
    return (
      <Pastille avecPoint={false} etiree onClick={restore}>
        <span className="text-sm font-medium">L&apos;assistant rédige</span>
        <LoadingDots className="[&>span]:h-1 [&>span]:w-1 [&>span]:bg-white" />
      </Pastille>
    );
  }

  // Une conversation encore vide n'a rien à reprendre : la pastille garde son
  // état de départ, et rouvre l'assistant dans sa vue.
  if (messages.length === 0) return <PastilleDemander onClick={restore} />;

  return (
    <Pastille avecPoint etiree={false} onClick={restore}>
      <span className="flex min-w-0 flex-col">
        <span className="text-[11px] leading-[14px] opacity-80">Reprendre</span>
        <span className="truncate text-[13px] font-medium leading-[17px]">
          {titre}
        </span>
      </span>
    </Pastille>
  );
};

export const AlbertPastille = ({
  conversation,
  onOuvrir,
}: {
  conversation: CurrentConversation | null;
  onOuvrir: () => void;
}) => {
  if (conversation) return <PastilleConversation conversation={conversation} />;

  return <PastilleDemander onClick={onOuvrir} />;
};
