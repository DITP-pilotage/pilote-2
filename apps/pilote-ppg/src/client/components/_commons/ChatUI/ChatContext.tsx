import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import type { ChatStatus } from "ai";

type ChatContextValue = {
  sendMessage: (params: { text: string }) => void;
  fillInput: (text: string) => void;
  status: ChatStatus;
  error: Error | undefined;
  stop: () => void;
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
}: PropsWithChildren<ChatContextValue>) => {
  const value = useMemo(
    () => ({ sendMessage, fillInput, status, error, stop }),
    [sendMessage, fillInput, status, error, stop],
  );

  return <context.Provider value={value}>{children}</context.Provider>;
};
