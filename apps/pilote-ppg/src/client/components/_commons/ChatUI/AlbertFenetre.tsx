import type { KeyboardEvent, PointerEvent } from "react";
import type { CurrentConversation } from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { AlbertContenu } from "@/components/_commons/ChatUI/AlbertContenu";
import {
  bornerTailleFenetre,
  TAILLE_FENETRE,
  type TailleFenetre,
} from "@/components/_commons/ChatUI/affichageAssistant";
import {
  readTailleFenetre,
  writeTailleFenetre,
} from "@/components/_commons/ChatUI/preferencesAssistantStorage";
import { useResizable } from "@/components/_commons/ChatUI/useResizable";
import { NOM_ASSISTANT } from "@/components/_commons/ChatUI/libellesAssistant";

const PAS_CLAVIER_PX = 20;
// Marge entre la fenêtre et les bords de l'écran (bottom-4 / right-4).
const MARGE_PX = 16;

type Bord = "gauche" | "haut" | "coin";

const borner = (taille: TailleFenetre) =>
  bornerTailleFenetre({
    taille,
    largeurEcran: window.innerWidth,
    hauteurEcran: window.innerHeight,
  });

const lireTaille = () =>
  readTailleFenetre() ?? {
    largeur: TAILLE_FENETRE.largeur.parDefaut,
    hauteur: TAILLE_FENETRE.hauteur.parDefaut,
  };

export const AlbertFenetre = ({
  conversation,
}: {
  conversation: CurrentConversation;
}) => {
  const {
    size: taille,
    latestSize,
    draggedHandle: bordTire,
    resize,
    resizeAndPersist,
    startDrag,
    endDrag,
  } = useResizable<TailleFenetre, Bord>({
    read: lireTaille,
    bound: borner,
    persist: writeTailleFenetre,
  });
  const tailleMax = borner({
    largeur: TAILLE_FENETRE.largeur.max,
    hauteur: Number.POSITIVE_INFINITY,
  });

  const deplacer = (event: PointerEvent<HTMLDivElement>) => {
    if (!bordTire) return;
    const largeur = window.innerWidth - MARGE_PX - event.clientX;
    const hauteur = window.innerHeight - MARGE_PX - event.clientY;
    resize({
      ...latestSize.current,
      ...(bordTire !== "haut" ? { largeur } : {}),
      ...(bordTire !== "gauche" ? { hauteur } : {}),
    });
  };

  const auClavier =
    (dimension: keyof TailleFenetre) =>
    (event: KeyboardEvent<HTMLDivElement>) => {
      const agrandir = dimension === "largeur" ? "ArrowLeft" : "ArrowUp";
      const reduire = dimension === "largeur" ? "ArrowRight" : "ArrowDown";
      const sens = event.key === agrandir ? 1 : event.key === reduire ? -1 : 0;
      if (sens === 0) return;
      event.preventDefault();
      resizeAndPersist({
        ...latestSize.current,
        [dimension]: latestSize.current[dimension] + sens * PAS_CLAVIER_PX,
      });
    };

  const gestesPointeur = (bord: Bord) => ({
    onPointerCancel: endDrag,
    onPointerDown: startDrag(bord),
    onPointerMove: deplacer,
    onPointerUp: endDrag,
  });

  return (
    <section
      aria-label={NOM_ASSISTANT}
      className="fixed bottom-4 right-4 z-[1750] flex flex-col border border-dsfr-grey-900 bg-white shadow-lg print:hidden"
      // En style et pas en classe : Tailwind est configuré en important et
      // l'emporterait sur les dimensions choisies.
      style={{ width: taille.largeur, height: taille.hauteur }}
    >
      <div
        aria-label="Largeur de la fenêtre de l'assistant"
        aria-orientation="vertical"
        aria-valuemax={tailleMax.largeur}
        aria-valuemin={TAILLE_FENETRE.largeur.min}
        aria-valuenow={taille.largeur}
        className="absolute -left-1 bottom-0 top-3 z-10 w-2 cursor-ew-resize touch-none focus-visible:bg-primary/30 focus-visible:outline-none"
        onKeyDown={auClavier("largeur")}
        role="separator"
        tabIndex={0}
        title="Redimensionner la fenêtre"
        {...gestesPointeur("gauche")}
      />
      <div
        aria-label="Hauteur de la fenêtre de l'assistant"
        aria-orientation="horizontal"
        aria-valuemax={tailleMax.hauteur}
        aria-valuemin={TAILLE_FENETRE.hauteur.min}
        aria-valuenow={taille.hauteur}
        className="absolute -top-1 left-3 right-0 z-10 h-2 cursor-ns-resize touch-none focus-visible:bg-primary/30 focus-visible:outline-none"
        onKeyDown={auClavier("hauteur")}
        role="separator"
        tabIndex={0}
        title="Redimensionner la fenêtre"
        {...gestesPointeur("haut")}
      />
      <div
        aria-hidden="true"
        className="absolute -left-1 -top-1 z-10 h-4 w-4 cursor-nwse-resize touch-none"
        {...gestesPointeur("coin")}
      />
      <AlbertContenu compact conversation={conversation} />
    </section>
  );
};
