import { createContext, useContext } from "react";

export type TailleTuile = "XS" | "SM" | "MD" | "XL";
export type ModeDisposition = "P" | "G";

const SEUIL_SM = 512;
const SEUIL_MD = 704;
const SEUIL_XL = 992;
const ECART_COLONNES = 16;

export const calculerTailleTuile = (largeur: number): TailleTuile => {
  if (largeur < SEUIL_SM) return "XS";
  if (largeur < SEUIL_MD) return "SM";
  if (largeur < SEUIL_XL) return "MD";
  return "XL";
};

export const calculerModeDisposition = (
  largeurConteneur: number,
  colonnes: number,
): ModeDisposition => {
  const largeurWidget =
    colonnes === 1
      ? largeurConteneur
      : (largeurConteneur - ECART_COLONNES * (colonnes - 1)) / colonnes;

  return largeurWidget < SEUIL_SM ? "P" : "G";
};

type TuileWidgetContextValue = {
  tailleTuile: TailleTuile;
  modeDisposition: ModeDisposition;
};

export const TuileWidgetCtx = createContext<TuileWidgetContextValue | null>(
  null,
);

export const useTuileWidget = () => {
  const ctx = useContext(TuileWidgetCtx);
  if (!ctx)
    throw new Error("useTuileWidget must be used within TuileWidget provider");

  return {
    isModeDispositionG: () => ctx.modeDisposition === "G",
    isTailleTuileXL: () => ctx.tailleTuile === "XL",
  };
};
