import { AlbertMonogramme } from "@/components/_commons/ChatUI/AlbertMonogramme";
import type { ContexteAccueil } from "@/components/_commons/ChatUI/ChatEmptyState";
import { NOM_ASSISTANT } from "@/components/_commons/ChatUI/libellesAssistant";

const estMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent);

// Occupe l'emplacement et le gabarit du dock : réduire une conversation le
// remplace par le dock, la fermer le fait revenir.
export const AlbertLanceur = ({
  contexte,
  onOuvrir,
}: {
  contexte?: ContexteAccueil;
  onOuvrir: () => void;
}) => {
  const mac = estMac();

  return (
    <button
      aria-keyshortcuts={mac ? "Meta+K" : "Control+K"}
      className="fixed bottom-4 right-4 z-[1750] flex h-12 items-center gap-2.5 border border-dsfr-grey-900 bg-white pl-2.5 pr-3 text-left shadow-md transition-colors hover:border-primary hover:bg-dsfr-blue-france-950 print:hidden"
      onClick={onOuvrir}
      type="button"
    >
      <AlbertMonogramme taille="sm" />
      <span className="sr-only md:not-sr-only md:flex md:flex-col">
        <span className="text-[13px] font-medium leading-[18px] text-dsfr-grey-50">
          Demander à l&apos;{NOM_ASSISTANT}
        </span>
        {contexte ? (
          <span className="text-[11px] leading-[14px] text-dsfr-mention-grey">
            {contexte.territoireNom} · Jalon {contexte.jalon}
          </span>
        ) : null}
      </span>
      <kbd
        aria-hidden="true"
        className="ml-1.5 hidden border border-dsfr-grey-900 px-1.5 py-0.5 font-[inherit] text-[11px] leading-4 text-dsfr-grey-200 md:inline"
      >
        {mac ? "⌘ K" : "Ctrl K"}
      </kbd>
    </button>
  );
};
