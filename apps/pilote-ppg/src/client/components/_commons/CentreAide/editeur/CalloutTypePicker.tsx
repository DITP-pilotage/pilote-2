import {
  createElement,
  FunctionComponent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CalloutColor,
  colorVariants,
  iconeCallout,
  VARIANTES_CALLOUT,
} from "@/client/components/shared/Callout";
import { clsxm } from "@/utils/clsxm";
import { FloatingToolbar, FloatingToolbarButton } from "./FloatingToolbar";

export const CalloutTypePicker: FunctionComponent<{
  color: CalloutColor;
  onChange: (color: CalloutColor) => void;
}> = ({ color, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      const isInside =
        event.target instanceof Node &&
        containerRef.current?.contains(event.target);
      if (!isInside) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div contentEditable={false} ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-label="Changer le type d'encadré"
        // Le retrait négatif agrandit la zone cliquable sans décaler l'icône.
        className={clsxm(
          "-m-1 block rounded p-1 transition-colors hover:bg-black/10",
          isOpen && "bg-black/10",
        )}
        onClick={() => setIsOpen((wasOpen) => !wasOpen)}
        onMouseDown={(event) => event.preventDefault()}
        title="Changer le type d'encadré"
        type="button"
      >
        {createElement(iconeCallout(color), {
          className: "pointer-events-none h-5 w-5",
          fill: "currentColor",
        })}
      </button>
      {isOpen && (
        <FloatingToolbar label="Type d'encadré">
          {VARIANTES_CALLOUT.map(({ couleur, libelle, Icone }) => (
            <FloatingToolbarButton
              actif={couleur === color}
              key={couleur}
              label={libelle}
              onClick={() => onChange(couleur)}
            >
              <span
                className={clsxm(
                  "pointer-events-none flex h-5 w-5 items-center justify-center rounded-sm",
                  colorVariants[couleur].bg,
                  colorVariants[couleur].iconColor,
                )}
              >
                <Icone className="h-4 w-4" fill="currentColor" />
              </span>
            </FloatingToolbarButton>
          ))}
        </FloatingToolbar>
      )}
    </div>
  );
};
