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
import api from "@/server/infrastructure/api/trpc/api";

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
        onFinish: () => trpcUtils.albert.conversations.lister.invalidate(),
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
      setConversation(
        (current) =>
          current ??
          build({ id: crypto.randomUUID(), agentContext, scenarios }),
      );
      setDisplay("fullscreen");
    },
    [build],
  );

  const minimize = useCallback(() => {
    if (conversation) {
      writeMinimizedConversation({
        id: conversation.chat.id,
        agentContext: conversation.agentContext,
      });
    }
    setDisplay("minimized");
  }, [conversation]);

  const restore = useCallback(() => setDisplay("fullscreen"), []);

  const close = useCallback(() => {
    conversation?.chat.stop();
    clearMinimizedConversation();
    setConversation(null);
    setDisplay("fullscreen");
  }, [conversation]);

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
      conversation.chat.stop();
      clearMinimizedConversation();
      load({
        id,
        agentContext: conversation.agentContext,
        targetDisplay: "fullscreen",
      });
    },
    [conversation, load],
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
