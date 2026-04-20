import { createContext, useContext } from "react";

export type ModeDisposition = "P" | "M" | "G";

const SEUIL_MODE_M = 400;
const SEUIL_MODE_G = 736;

export const calculerModeDisposition = (largeur: number): ModeDisposition => {
  if (largeur >= SEUIL_MODE_G) return "G";
  if (largeur >= SEUIL_MODE_M) return "M";
  return "P";
};

type MesureWidgetContextValue = {
  modeDisposition: ModeDisposition;
  largeur: number;
};

export const MesureWidgetCtx = createContext<MesureWidgetContextValue | null>(
  null,
);

export const useMesureWidget = () => {
  const ctx = useContext(MesureWidgetCtx);
  if (!ctx)
    throw new Error("useMesureWidget must be used within TuileWidget provider");

  return {
    isModeP: ctx.modeDisposition === "P",
    isModeM: ctx.modeDisposition === "M",
    isModeG: ctx.modeDisposition === "G",
    largeur: ctx.largeur,
  };
};
