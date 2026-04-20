import {
  FunctionComponent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { clsxm } from "@/utils/clsxm";

interface SecureTooltipProps {
  children: ReactNode;
  border?: string;
  classNameInfoBulle?: string;
  anchorEl: HTMLElement | null;
  isVisible: boolean;
  positionTooltip?: "centre" | "droite";
}

/**
 * Tooltip sécurisé qui utilise Emotion pour les styles de base,
 * compatible avec la Content Security Policy (CSP) utilisant des nonces
 */
const SecureTooltip: FunctionComponent<SecureTooltipProps> = ({
  children,
  border,
  classNameInfoBulle,
  anchorEl,
  isVisible,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );

  useEffect(() => {
    // Créer le conteneur pour le portail
    const container = document.createElement("div");
    document.body.append(container);
    setPortalContainer(container);

    return () => {
      // Nettoyage : supprimer le conteneur quand le composant est démonté
      container.remove();
    };
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      if (!anchorEl || !tooltipRef.current) return;

      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const anchorRect = anchorEl.getBoundingClientRect();

      // Calculer la position optimale
      let top = anchorRect.top - tooltipRect.height - 5; // Position au-dessus du bouton

      // Calculer la position horizontale centrée par rapport au bouton
      let left = anchorRect.left + (anchorRect.width - tooltipRect.width) / 2;

      // Vérifier si le tooltip dépasse les bords de l'écran
      const absoluteRight = left + tooltipRect.width;

      // Ajuster si le tooltip dépasse la fenêtre
      if (absoluteRight > window.innerWidth) {
        left = left - (absoluteRight - window.innerWidth) - 10; // 10px de marge
      }

      if (left < 0) {
        left = 10; // 10px de marge à gauche
      }

      // Si le tooltip dépasse en haut, le positionner en dessous du bouton
      if (top < 0) {
        top = anchorRect.bottom + 5;
      }

      setPosition({ top, left });
    };

    if (isVisible) {
      // Petit délai pour s'assurer que le tooltip est rendu
      const timer = setTimeout(updatePosition, 0);
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isVisible, anchorEl]);

  if (!anchorEl || !portalContainer) return null;

  return createPortal(
    <div
      className={clsxm(
        "fixed z-[10000] min-w-[400px] max-w-[500px] text-dsfr-grey-50 bg-dsfr-alt-blue-france rounded-lg shadow-[0_4px_2px_rgba(0,0,0,0.1)] p-3 transition-opacity duration-200 pointer-events-none whitespace-normal break-words [&_.fr-text--sm]:!m-0",
        isVisible ? "opacity-100 visible" : "opacity-0 invisible",
        classNameInfoBulle === "infobull--sm" && "!min-w-[250px] !p-0",
        classNameInfoBulle === "tooltip-accordeon" && "!max-w-[50%]",
        classNameInfoBulle,
      )}
      ref={tooltipRef}
      style={{
        border,
        left: position.left,
        top: position.top,
      }}
    >
      {children}
    </div>,
    portalContainer,
  );
};

export default SecureTooltip;
