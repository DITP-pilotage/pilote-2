import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import type { ChatStatus } from "ai";

type ChatContextValue = {
  sendMessage: (params: { text: string }) => void;
  fillInput: (text: string) => void;
  status: ChatStatus;
  error: Error | undefined;
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
}: PropsWithChildren<ChatContextValue>) => {
  const value = useMemo(
    () => ({ sendMessage, fillInput, status, error }),
    [sendMessage, fillInput, status, error],
  );

  return <context.Provider value={value}>{children}</context.Provider>;
};
