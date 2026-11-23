import { FunctionComponent, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

export const FloatingToolbar: FunctionComponent<{
  children: ReactNode;
  label?: string;
}> = ({ children, label }) => (
  <div
    aria-label={label}
    className="absolute -top-10 left-0 z-10 flex items-center gap-0.5 rounded-lg bg-gray-800 p-1 shadow-lg"
    contentEditable={false}
    role={label ? "group" : undefined}
  >
    {children}
  </div>
);

export const FloatingToolbarButton: FunctionComponent<{
  actif: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}> = ({ actif, label, onClick, children }) => (
  <button
    aria-label={label}
    aria-pressed={actif}
    className={clsxm(
      "flex h-7 w-7 items-center justify-center rounded text-white/90 transition-colors hover:bg-white/15",
      actif && "bg-white/20 text-white",
    )}
    // Empêche le blur : la sélection courante de l'éditeur reste active au clic.
    onClick={onClick}
    onMouseDown={(event) => event.preventDefault()}
    title={label}
    type="button"
  >
    {children}
  </button>
);
