import { createContext, PropsWithChildren, useContext } from "react";
import type { ChatStatus } from "ai";

type ChatContextValue = {
  sendMessage: (params: { text: string }) => void;
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
  ...props
}: PropsWithChildren<ChatContextValue>) => {
  return <context.Provider value={props}>{children}</context.Provider>;
};
