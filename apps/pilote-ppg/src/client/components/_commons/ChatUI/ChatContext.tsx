import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import type { ChatStatus } from "ai";
import type { OptionsLiensChantiers } from "@/components/_commons/ChatUI/remarkLiensChantiers";

type ChatContextValue = {
  sendMessage: (params: { text: string }) => void;
  fillInput: (text: string) => void;
  status: ChatStatus;
  error: Error | undefined;
  stop: () => void;
  optionsLiensChantiers: OptionsLiensChantiers;
};

const context = createContext<ChatContextValue | null>(null);

export const useChatContext = () => {
  const contextValue = useContext(context);

  if (!contextValue) {
    throw new Error(
      "useChatContext must be used within a ChatContextProvider!",
    );
  }

  return contextValue;
};

export const ChatContextProvider = ({
  children,
  sendMessage,
  fillInput,
  status,
  error,
  stop,
  optionsLiensChantiers,
}: PropsWithChildren<ChatContextValue>) => {
  const value = useMemo(
    () => ({
      sendMessage,
      fillInput,
      status,
      error,
      stop,
      optionsLiensChantiers,
    }),
    [sendMessage, fillInput, status, error, stop, optionsLiensChantiers],
  );

  return <context.Provider value={value}>{children}</context.Provider>;
};
