import type { KeyboardEvent, PointerEvent } from "react";
import {
  useAlbertConversation,
  type CurrentConversation,
} from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { AlbertContenu } from "@/components/_commons/ChatUI/AlbertContenu";
import {
  bornerLargeurPanneau,
  LARGEUR_PANNEAU,
} from "@/components/_commons/ChatUI/affichageAssistant";
import {
  readLargeurPanneau,
  writeLargeurPanneau,
} from "@/components/_commons/ChatUI/preferencesAssistantStorage";
import { useResizable } from "@/components/_commons/ChatUI/useResizable";
import { NOM_ASSISTANT } from "@/components/_commons/ChatUI/libellesAssistant";

const PAS_CLAVIER_PX = 20;

const borner = (largeur: number) =>
  bornerLargeurPanneau({ largeur, largeurEcran: window.innerWidth });

const lireLargeur = () => readLargeurPanneau() ?? LARGEUR_PANNEAU.parDefaut;

const Panneau = ({ conversation }: { conversation: CurrentConversation }) => {
  const {
    size: largeur,
    latestSize,
    draggedHandle,
    resize,
    resizeAndPersist,
    startDrag,
    endDrag,
  } = useResizable<number, "gauche">({
    read: lireLargeur,
    bound: borner,
    persist: writeLargeurPanneau,
  });
  const redimensionne = draggedHandle !== null;

  const deplacer = (event: PointerEvent<HTMLDivElement>) => {
    if (!redimensionne) return;
    resize(window.innerWidth - event.clientX);
  };

  const auClavier = (event: KeyboardEvent<HTMLDivElement>) => {
    const sens =
      event.key === "ArrowLeft" ? 1 : event.key === "ArrowRight" ? -1 : 0;
    if (sens === 0) return;
    event.preventDefault();
    resizeAndPersist(latestSize.current + sens * PAS_CLAVIER_PX);
  };

  return (
    <aside
      aria-label={NOM_ASSISTANT}
      className="sticky top-0 z-[2] flex h-screen shrink-0 flex-col border-l border-dsfr-grey-900 bg-white print:hidden"
      // En style et pas en classe : Tailwind est configuré en important et
      // l'emporterait sur la largeur choisie.
      style={{ width: largeur }}
    >
      <div
        aria-label="Largeur du panneau de l'assistant"
        aria-orientation="vertical"
        aria-valuemax={borner(LARGEUR_PANNEAU.max)}
        aria-valuemin={LARGEUR_PANNEAU.min}
        aria-valuenow={largeur}
        className="group absolute -left-1.5 bottom-0 top-0 z-10 flex w-3 cursor-col-resize touch-none items-center justify-center focus:outline-none"
        onKeyDown={auClavier}
        onPointerCancel={endDrag}
        onPointerDown={startDrag("gauche")}
        onPointerMove={deplacer}
        onPointerUp={endDrag}
        role="separator"
        tabIndex={0}
        title="Redimensionner le panneau"
      >
        <span
          className={
            redimensionne
              ? "h-12 w-1 rounded-full bg-primary"
              : "h-12 w-1 rounded-full bg-dsfr-blue-france-850 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:bg-primary group-focus-visible:opacity-100"
          }
        />
      </div>
      <AlbertContenu compact conversation={conversation} />
    </aside>
  );
};

export const AlbertPanneauLateral = () => {
  const { conversation, display } = useAlbertConversation();

  if (!conversation || display !== "sidePanel") return null;

  return <Panneau conversation={conversation} />;
};
