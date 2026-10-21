import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChatScenarios } from "@/components/_commons/ChatUI/ChatEmptyState";
import {
  answerOutcomeEvent,
  choicesPresentedEvent,
} from "@/components/_commons/ChatUI/assistantEvents";
import { useAssistantTracking } from "@/components/_commons/ChatUI/useAssistantTracking";
import {
  createAlbertConversation,
  type AlbertAgentContext,
  type AlbertConversation,
} from "@/components/_commons/ChatUI/createAlbertConversation";
import {
  clearMinimizedConversation,
  readMinimizedConversation,
  writeMinimizedConversation,
} from "@/components/_commons/ChatUI/minimizedConversationStorage";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { api } from "@/server/framework/trpc/api";

export type AlbertDisplay = "fullscreen" | "minimized";

export type CurrentConversation = AlbertConversation & {
  agentContext: AlbertAgentContext;
  scenarios?: ChatScenarios;
};

type AlbertConversationContextValue = {
  conversation: CurrentConversation | null;
  display: AlbertDisplay;
  open: (params: {
    agentContext: AlbertAgentContext;
    scenarios: ChatScenarios;
  }) => void;
  minimize: () => void;
  restore: () => void;
  close: () => void;
  startNewConversation: () => void;
  selectConversation: (id: string) => void;
};

const context = createContext<AlbertConversationContextValue | null>(null);

export const useAlbertConversation = (): AlbertConversationContextValue => {
  const value = useContext(context);
  if (!value) {
    throw new Error(
      "useAlbertConversation must be used within an AlbertConversationProvider!",
    );
  }
  return value;
};

export const AlbertConversationProvider = ({ children }: PropsWithChildren) => {
  const [conversation, setConversation] = useState<CurrentConversation | null>(
    null,
  );
  const [display, setDisplay] = useState<AlbertDisplay>("fullscreen");
  const trpcUtils = api.useUtils();
  const track = useAssistantTracking();
  const trackRef = useRef(track);

  useEffect(() => {
    trackRef.current = track;
  }, [track]);

  const build = useCallback(
    ({
      id,
      agentContext,
      scenarios,
      messages,
    }: {
      id: string;
      agentContext: AlbertAgentContext;
      scenarios?: ChatScenarios;
      messages?: PiloteUIMessage[];
    }): CurrentConversation => ({
      ...createAlbertConversation({
        id,
        agentContext,
        messages,
        onFinish: ({ message, isAbort, isError }) => {
          void trpcUtils.albert.conversations.lister.invalidate();
          const event = answerOutcomeEvent({
            conversationId: id,
            message,
            isAbort,
            isError,
          });
          if (event) trackRef.current(event);
          if (isAbort || isError) return;
          const choices = choicesPresentedEvent({
            conversationId: id,
            message,
          });
          if (choices) trackRef.current(choices);
        },
      }),
      agentContext,
      scenarios,
    }),
    [trpcUtils],
  );

  const load = useCallback(
    async ({
      id,
      agentContext,
      targetDisplay,
    }: {
      id: string;
      agentContext: AlbertAgentContext;
      targetDisplay: AlbertDisplay;
    }) => {
      try {
        const stored = await trpcUtils.albert.conversations.recuperer.fetch({
          id,
        });
        // A missing conversation resolves to null rather than throwing.
        if (!stored) {
          clearMinimizedConversation();
          return;
        }
        setConversation(build({ id, agentContext, messages: stored.messages }));
        setDisplay(targetDisplay);
      } catch {
        // Never persisted (no turn completed yet) or already purged: the
        // fallback is simply not to show it.
        clearMinimizedConversation();
      }
    },
    [build, trpcUtils],
  );

  const restoredFromStorage = useRef(false);

  useEffect(() => {
    if (restoredFromStorage.current) return;
    restoredFromStorage.current = true;

    const stored = readMinimizedConversation();
    if (!stored) return;

    load({
      id: stored.id,
      agentContext: stored.agentContext,
      targetDisplay: "minimized",
    });
  }, [load]);

  const open = useCallback<AlbertConversationContextValue["open"]>(
    ({ agentContext, scenarios }) => {
      if (conversation) {
        track({
          action: "resume",
          name: "assistant.resume",
          dimensions: { conversation_id: conversation.chat.id },
        });
      } else {
        const created = build({
          id: crypto.randomUUID(),
          agentContext,
          scenarios,
        });
        setConversation(created);
        track({
          action: "open",
          name: "assistant.open",
          dimensions: { conversation_id: created.chat.id },
        });
      }
      setDisplay("fullscreen");
    },
    [build, conversation, track],
  );

  const minimize = useCallback(() => {
    if (conversation) {
      track({
        action: "minimize",
        name: "assistant.minimize",
        dimensions: { conversation_id: conversation.chat.id },
      });
      writeMinimizedConversation({
        id: conversation.chat.id,
        agentContext: conversation.agentContext,
      });
    }
    setDisplay("minimized");
  }, [conversation, track]);

  const restore = useCallback(() => {
    track({
      action: "resume",
      name: "assistant.resume",
      dimensions: { conversation_id: conversation?.chat.id },
    });
    setDisplay("fullscreen");
  }, [conversation, track]);

  const close = useCallback(() => {
    track({
      action: "close",
      name: "assistant.close",
      dimensions: { conversation_id: conversation?.chat.id },
    });
    conversation?.chat.stop();
    clearMinimizedConversation();
    setConversation(null);
    setDisplay("fullscreen");
  }, [conversation, track]);

  const startNewConversation = useCallback(() => {
    if (!conversation) return;
    conversation.chat.stop();
    clearMinimizedConversation();
    setConversation(
      build({
        id: crypto.randomUUID(),
        agentContext: conversation.agentContext,
        scenarios: conversation.scenarios,
      }),
    );
    setDisplay("fullscreen");
  }, [conversation, build]);

  const selectConversation = useCallback(
    (id: string) => {
      if (!conversation) return;
      track({
        action: "select",
        name: "conversation.history.open",
        dimensions: { conversation_id: id },
      });
      conversation.chat.stop();
      clearMinimizedConversation();
      load({
        id,
        agentContext: conversation.agentContext,
        targetDisplay: "fullscreen",
      });
    },
    [conversation, load, track],
  );

  const value = useMemo(
    () => ({
      conversation,
      display,
      open,
      minimize,
      restore,
      close,
      startNewConversation,
      selectConversation,
    }),
    [
      conversation,
      display,
      open,
      minimize,
      restore,
      close,
      startNewConversation,
      selectConversation,
    ],
  );

  return <context.Provider value={value}>{children}</context.Provider>;
};
