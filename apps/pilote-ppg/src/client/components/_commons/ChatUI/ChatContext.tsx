import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import type { ChatStatus } from "ai";
import type { PropositionOrigin } from "@/components/_commons/ChatUI/assistantEvents";
import type { AssistantEvent } from "@/components/_commons/ChatUI/useAssistantTracking";

type ChatContextValue = {
  sendMessage: (params: {
    text: string;
    proposition?: PropositionOrigin;
  }) => void;
  fillInput: (text: string, proposition?: PropositionOrigin) => void;
  status: ChatStatus;
  error: Error | undefined;
  stop: () => void;
  track: (event: AssistantEvent) => void;
};

const context = createContext<ChatContextValue | null>(null);
const trackingContext = createContext<ChatContextValue["track"] | null>(null);

export const useChatContext = () => {
  const contextValue = useContext(context);

  if (!contextValue) {
    throw new Error(
      "useChatContext must be used within a ChatContextProvider!",
    );
  }

  return contextValue;
};

const ignoreEvent = () => {};

export const useChatTracking = () => useContext(trackingContext) ?? ignoreEvent;

export const ChatContextProvider = ({
  children,
  sendMessage,
  fillInput,
  status,
  error,
  stop,
  track,
}: PropsWithChildren<ChatContextValue>) => {
  const value = useMemo(
    () => ({ sendMessage, fillInput, status, error, stop, track }),
    [sendMessage, fillInput, status, error, stop, track],
  );

  return (
    <context.Provider value={value}>
      <trackingContext.Provider value={track}>
        {children}
      </trackingContext.Provider>
    </context.Provider>
  );
};
