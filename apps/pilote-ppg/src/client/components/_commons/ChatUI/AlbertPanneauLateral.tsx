import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";
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
import { NOM_ASSISTANT } from "@/components/_commons/ChatUI/libellesAssistant";

const PAS_CLAVIER_PX = 20;

// Tant que l'en-tête de la page est visible, le panneau commence sous lui :
// sa hauteur s'arrête au bas de l'écran pour que la saisie reste visible.
const useHauteurJusquAuBasDeLEcran = (
  ref: RefObject<HTMLElement | null>,
): number | undefined => {
  const [hauteur, setHauteur] = useState<number>();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frame = 0;
    const mesurer = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const haut = Math.max(element.getBoundingClientRect().top, 0);
        setHauteur(window.innerHeight - haut);
      });
    };

    mesurer();
    window.addEventListener("scroll", mesurer, { passive: true });
    window.addEventListener("resize", mesurer);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", mesurer);
      window.removeEventListener("resize", mesurer);
    };
  }, [ref]);

  return hauteur;
};

// La largeur se règle en tirant le bord gauche, ou aux flèches du clavier
// sur la poignée ; elle est retenue au relâchement.
const useLargeurPanneau = () => {
  const [largeur, setLargeur] = useState(() =>
    bornerLargeurPanneau({
      largeur: readLargeurPanneau() ?? LARGEUR_PANNEAU.parDefaut,
      largeurEcran: window.innerWidth,
    }),
  );

  useEffect(() => {
    const reborner = () =>
      setLargeur((actuelle) =>
        bornerLargeurPanneau({
          largeur: actuelle,
          largeurEcran: window.innerWidth,
        }),
      );
    window.addEventListener("resize", reborner);
    return () => window.removeEventListener("resize", reborner);
  }, []);

  const changer = (voulue: number) => {
    const bornee = bornerLargeurPanneau({
      largeur: voulue,
      largeurEcran: window.innerWidth,
    });
    setLargeur(bornee);
    return bornee;
  };

  return { largeur, changer };
};

const Panneau = ({ conversation }: { conversation: CurrentConversation }) => {
  const ref = useRef<HTMLElement>(null);
  const hauteur = useHauteurJusquAuBasDeLEcran(ref);
  const { largeur, changer } = useLargeurPanneau();
  const [redimensionne, setRedimensionne] = useState(false);

  const deplacer = (event: PointerEvent<HTMLDivElement>) => {
    if (!redimensionne) return;
    changer(window.innerWidth - event.clientX);
  };

  const relacher = (event: PointerEvent<HTMLDivElement>) => {
    if (!redimensionne) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setRedimensionne(false);
    writeLargeurPanneau(largeur);
  };

  const auClavier = (event: KeyboardEvent<HTMLDivElement>) => {
    const sens =
      event.key === "ArrowLeft" ? 1 : event.key === "ArrowRight" ? -1 : 0;
    if (sens === 0) return;
    event.preventDefault();
    writeLargeurPanneau(changer(largeur + sens * PAS_CLAVIER_PX));
  };

  return (
    <aside
      aria-label={NOM_ASSISTANT}
      className="sticky top-0 z-[2] flex shrink-0 flex-col border-l border-dsfr-grey-900 bg-white print:hidden"
      ref={ref}
      // En style et pas en classe : Tailwind est configuré en important et
      // l'emporterait sur les dimensions calculées.
      style={{ width: largeur, height: hauteur ?? "100vh" }}
    >
      <div
        aria-label="Largeur du panneau de l'assistant"
        aria-orientation="vertical"
        aria-valuemax={bornerLargeurPanneau({
          largeur: LARGEUR_PANNEAU.max,
          largeurEcran: window.innerWidth,
        })}
        aria-valuemin={LARGEUR_PANNEAU.min}
        aria-valuenow={largeur}
        className="group absolute -left-1.5 bottom-0 top-0 z-10 flex w-3 cursor-col-resize touch-none items-center justify-center focus:outline-none"
        onKeyDown={auClavier}
        onPointerCancel={relacher}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          setRedimensionne(true);
        }}
        onPointerMove={deplacer}
        onPointerUp={relacher}
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

// Colonne de la mise en page, à côté du contenu : le panneau pousse la page
// au lieu de la recouvrir, et reste visible pendant qu'elle défile.
export const AlbertPanneauLateral = () => {
  const { conversation, display } = useAlbertConversation();

  if (!conversation || display !== "sidePanel") return null;

  return <Panneau conversation={conversation} />;
};
