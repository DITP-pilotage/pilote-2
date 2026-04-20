import { createContext, PropsWithChildren, useContext } from "react";

type IndicateurDetailsMode = "widget" | null;

const context = createContext<IndicateurDetailsMode>(null);

export const useIndicateurDetailsMode = () => useContext(context);

export const IndicateurDetailsModeProvider = ({
  mode,
  children,
}: PropsWithChildren<{ mode: IndicateurDetailsMode }>) => (
  <context.Provider value={mode}>{children}</context.Provider>
);
