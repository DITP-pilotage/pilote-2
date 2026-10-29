import { useEffect, useRef, useState, type RefObject } from "react";
import {
  useAlbertConversation,
  type CurrentConversation,
} from "@/components/_commons/ChatUI/AlbertConversationProvider";
import { AlbertVueCompacte } from "@/components/_commons/ChatUI/AlbertVueCompacte";

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

// Colonne de la mise en page, à côté du contenu : le panneau pousse la page
// au lieu de la recouvrir, et reste visible pendant qu'elle défile.
const Panneau = ({ conversation }: { conversation: CurrentConversation }) => {
  const ref = useRef<HTMLElement>(null);
  const hauteur = useHauteurJusquAuBasDeLEcran(ref);

  return (
    <aside
      aria-labelledby="albert-panneau-titre"
      className="sticky top-0 z-[2] flex w-[440px] shrink-0 flex-col border-l border-dsfr-grey-900 bg-white print:hidden"
      ref={ref}
      // En style et pas en classe : Tailwind est configuré en important et
      // l'emporterait sur la hauteur mesurée.
      style={{ height: hauteur ?? "100vh" }}
    >
      <AlbertVueCompacte
        conversation={conversation}
        idTitre="albert-panneau-titre"
      />
    </aside>
  );
};

export const AlbertPanneauLateral = () => {
  const { conversation, display } = useAlbertConversation();

  if (!conversation || display !== "sidePanel") return null;

  return <Panneau conversation={conversation} />;
};
