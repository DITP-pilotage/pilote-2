import { createContext, PropsWithChildren, useContext } from "react";
import type { ChantierLinkOptions } from "@/components/_commons/ChatUI/remarkChantierLinks";

const context = createContext<ChantierLinkOptions | null>(null);

export const useChantierLinks = (): ChantierLinkOptions => {
  const value = useContext(context);

  if (!value) {
    throw new Error(
      "useChantierLinks must be used within a ChantierLinksProvider!",
    );
  }

  return value;
};

export const ChantierLinksProvider = ({
  children,
  options,
}: PropsWithChildren<{ options: ChantierLinkOptions }>) => (
  <context.Provider value={options}>{children}</context.Provider>
);
