import { createContext, useContext } from "react";

export type ModeDisposition = "P" | "G";

const SEUIL_MODE_G = 400;

export const calculerModeDisposition = (largeur: number): ModeDisposition => {
  return largeur >= SEUIL_MODE_G ? "G" : "P";
};

type MesureWidgetContextValue = {
  modeDisposition: ModeDisposition;
};

export const MesureWidgetCtx = createContext<MesureWidgetContextValue | null>(
  null,
);

export const useMesureWidget = () => {
  const ctx = useContext(MesureWidgetCtx);
  if (!ctx)
    throw new Error("useMesureWidget must be used within TuileWidget provider");

  return {
    isModeDispositionG: () => ctx.modeDisposition === "G",
  };
};
