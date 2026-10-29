import {
  useEffect,
  useState,
  type KeyboardEvent,
  type PointerEvent,
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
      className="sticky top-0 z-[2] flex h-screen shrink-0 flex-col border-l border-dsfr-grey-900 bg-white print:hidden"
      // En style et pas en classe : Tailwind est configuré en important et
      // l'emporterait sur la largeur choisie.
      style={{ width: largeur }}
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

// Colonne de droite de la mise en page, du haut au bas de l'écran : le
// panneau pousse toute la page au lieu de la recouvrir, et reste visible
// pendant qu'elle défile.
export const AlbertPanneauLateral = () => {
  const { conversation, display } = useAlbertConversation();

  if (!conversation || display !== "sidePanel") return null;

  return <Panneau conversation={conversation} />;
};
