import {
  useEffect,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
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

const useTailleFenetre = () => {
  const [taille, setTaille] = useState(() =>
    borner(
      readTailleFenetre() ?? {
        largeur: TAILLE_FENETRE.largeur.parDefaut,
        hauteur: TAILLE_FENETRE.hauteur.parDefaut,
      },
    ),
  );

  useEffect(() => {
    const reborner = () => setTaille((actuelle) => borner(actuelle));
    window.addEventListener("resize", reborner);
    return () => window.removeEventListener("resize", reborner);
  }, []);

  const changer = (voulue: Partial<TailleFenetre>) => {
    const bornee = borner({ ...taille, ...voulue });
    setTaille(bornee);
    return bornee;
  };

  return { taille, changer };
};

// Fenêtre non modale : la page reste utilisable derrière, et la conversation
// suit la navigation. Ancrée en bas à droite, elle se redimensionne par son
// bord gauche, son bord haut ou son coin haut-gauche.
export const AlbertFenetre = ({
  conversation,
}: {
  conversation: CurrentConversation;
}) => {
  const { taille, changer } = useTailleFenetre();
  const [bordTire, setBordTire] = useState<Bord | null>(null);

  const tirer = (bord: Bord) => (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setBordTire(bord);
  };

  const deplacer = (event: PointerEvent<HTMLDivElement>) => {
    if (!bordTire) return;
    const largeur = window.innerWidth - MARGE_PX - event.clientX;
    const hauteur = window.innerHeight - MARGE_PX - event.clientY;
    changer({
      ...(bordTire !== "haut" ? { largeur } : {}),
      ...(bordTire !== "gauche" ? { hauteur } : {}),
    });
  };

  const relacher = (event: PointerEvent<HTMLDivElement>) => {
    if (!bordTire) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setBordTire(null);
    writeTailleFenetre(taille);
  };

  const auClavier =
    (dimension: keyof TailleFenetre) =>
    (event: KeyboardEvent<HTMLDivElement>) => {
      const agrandir = dimension === "largeur" ? "ArrowLeft" : "ArrowUp";
      const reduire = dimension === "largeur" ? "ArrowRight" : "ArrowDown";
      const sens = event.key === agrandir ? 1 : event.key === reduire ? -1 : 0;
      if (sens === 0) return;
      event.preventDefault();
      writeTailleFenetre(
        changer({ [dimension]: taille[dimension] + sens * PAS_CLAVIER_PX }),
      );
    };

  const gestesPointeur = (bord: Bord) => ({
    onPointerCancel: relacher,
    onPointerDown: tirer(bord),
    onPointerMove: deplacer,
    onPointerUp: relacher,
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
