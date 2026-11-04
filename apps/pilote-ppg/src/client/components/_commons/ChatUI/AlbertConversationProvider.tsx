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
  suitesPresentedEvent,
  exportsAvailableEvents,
} from "@/components/_commons/ChatUI/assistantEvents";
import { useAssistantTracking } from "@/components/_commons/ChatUI/useAssistantTracking";
import { contexteAAppliquer } from "@/components/_commons/ChatUI/contexteConversation";
import {
  albertAgentContextSchema,
  createAlbertConversation,
  type AlbertAgentContext,
  type AlbertConversation,
} from "@/components/_commons/ChatUI/createAlbertConversation";
import {
  clearMinimizedConversation,
  readMinimizedConversation,
  writeMinimizedConversation,
} from "@/components/_commons/ChatUI/minimizedConversationStorage";
import {
  affichageEffectif,
  vuesDisponibles,
  type AffichageAssistant,
  type VueAssistant,
} from "@/components/_commons/ChatUI/affichageAssistant";
import {
  readPreferenceVue,
  writePreferenceVue,
} from "@/components/_commons/ChatUI/preferencesAssistantStorage";
import { useTailleEcran } from "@/components/_commons/ChatUI/useTailleEcran";
import type { AnalyticsEventName } from "@/client/analytics/schema";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { api } from "@/server/framework/trpc/api";

const EVENEMENT_VUE: Record<VueAssistant, AnalyticsEventName> = {
  modal: "assistant.view.modal",
  sidePanel: "assistant.view.side_panel",
  floating: "assistant.view.floating",
};

export type CurrentConversation = AlbertConversation & {
  agentContext?: AlbertAgentContext;
  scenarios?: ChatScenarios;
};

export type AlbertPageContext = {
  agentContext: AlbertAgentContext;
  scenarios: ChatScenarios;
};

type AlbertConversationContextValue = {
  conversation: CurrentConversation | null;
  display: AffichageAssistant;
  vuesDisponibles: readonly VueAssistant[];
  pageContext: AlbertPageContext | null;
  setPageContext: (pageContext: AlbertPageContext | null) => void;
  open: () => void;
  changerVue: (vue: VueAssistant) => void;
  passerEnFenetre: () => void;
  minimize: () => void;
  restore: () => void;
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

export const useAlbertPageContext = (pageContext: AlbertPageContext) => {
  const { setPageContext } = useAlbertConversation();

  useEffect(() => {
    setPageContext(pageContext);
    return () => setPageContext(null);
  }, [pageContext, setPageContext]);
};

export const AlbertConversationProvider = ({
  actif,
  children,
}: PropsWithChildren<{ actif: boolean }>) => {
  const [conversation, setConversation] = useState<CurrentConversation | null>(
    null,
  );
  const [affichage, setAffichage] = useState<AffichageAssistant>("modal");
  const [viewBeforeMinimize, setViewBeforeMinimize] =
    useState<VueAssistant | null>(null);
  const tailleEcran = useTailleEcran();
  const display = affichageEffectif({ affichage, tailleEcran });
  const [pageContext, setPageContext] = useState<AlbertPageContext | null>(
    null,
  );
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
      agentContext?: AlbertAgentContext;
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
          const suites = suitesPresentedEvent({
            conversationId: id,
            message,
          });
          if (suites) trackRef.current(suites);
          exportsAvailableEvents({ conversationId: id, message }).forEach(
            (available) => trackRef.current(available),
          );
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
      targetDisplay,
    }: {
      id: string;
      targetDisplay?: AffichageAssistant;
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
        // The conversation resumes with the context it was held in, not the
        // one of the page or of the conversation being replaced.
        const agentContext = albertAgentContextSchema.safeParse(
          stored.contexte,
        ).data;
        setConversation(build({ id, agentContext, messages: stored.messages }));
        if (targetDisplay) setAffichage(targetDisplay);
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
    if (!actif || restoredFromStorage.current) return;
    restoredFromStorage.current = true;

    const stored = readMinimizedConversation();
    if (!stored) return;

    load({ id: stored.id, targetDisplay: "minimized" });
  }, [actif, load]);

  useEffect(() => {
    if (!conversation) return;
    const contexte = contexteAAppliquer({
      conversation,
      nombreMessages: conversation.chat.messages.length,
      page: pageContext,
    });
    if (!contexte) return;

    // Read by the transport on every request: the next message leaves with
    // the context of the page.
    conversation.requestBody.agentContext = contexte.agentContext;
    setConversation({ ...conversation, ...contexte });
  }, [conversation, pageContext]);

  const open = useCallback(() => {
    if (conversation) {
      track({
        action: "resume",
        name: "assistant.resume",
        dimensions: { conversation_id: conversation.chat.id },
      });
    } else {
      const created = build({
        id: crypto.randomUUID(),
        agentContext: pageContext?.agentContext,
        scenarios: pageContext?.scenarios,
      });
      setConversation(created);
      track({
        action: "open",
        name: "assistant.open",
        dimensions: { conversation_id: created.chat.id },
      });
    }
    setAffichage(readPreferenceVue() ?? "modal");
  }, [build, conversation, pageContext, track]);

  const changerVue = useCallback(
    (vue: VueAssistant) => {
      track({
        action: "select",
        name: EVENEMENT_VUE[vue],
        dimensions: { conversation_id: conversation?.chat.id },
      });
      writePreferenceVue(vue);
      setAffichage(vue);
    },
    [conversation, track],
  );

  // Passage de circonstance (pour laisser voir la page) : la vue préférée
  // reste celle que l'utilisateur a choisie.
  const passerEnFenetre = useCallback(() => setAffichage("floating"), []);

  const minimize = useCallback(() => {
    if (conversation) {
      track({
        action: "minimize",
        name: "assistant.minimize",
        dimensions: { conversation_id: conversation.chat.id },
      });
      writeMinimizedConversation({ id: conversation.chat.id });
    }
    if (affichage !== "minimized") setViewBeforeMinimize(affichage);
    setAffichage("minimized");
  }, [affichage, conversation, track]);

  const restore = useCallback(() => {
    track({
      action: "resume",
      name: "assistant.resume",
      dimensions: { conversation_id: conversation?.chat.id },
    });
    setAffichage(viewBeforeMinimize ?? readPreferenceVue() ?? "modal");
  }, [conversation, track, viewBeforeMinimize]);

  const startNewConversation = useCallback(() => {
    if (!conversation) return;
    conversation.chat.stop();
    clearMinimizedConversation();
    const created = build({
      id: crypto.randomUUID(),
      agentContext: pageContext?.agentContext,
      scenarios: pageContext?.scenarios,
    });
    setConversation(created);
    track({
      action: "open",
      name: "conversation.new",
      dimensions: { conversation_id: created.chat.id },
    });
  }, [build, conversation, pageContext, track]);

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
      load({ id });
    },
    [conversation, load, track],
  );

  const value = useMemo(
    () => ({
      conversation,
      display,
      vuesDisponibles: vuesDisponibles(tailleEcran),
      pageContext,
      setPageContext,
      open,
      changerVue,
      passerEnFenetre,
      minimize,
      restore,
      startNewConversation,
      selectConversation,
    }),
    [
      conversation,
      display,
      tailleEcran,
      pageContext,
      open,
      changerVue,
      passerEnFenetre,
      minimize,
      restore,
      startNewConversation,
      selectConversation,
    ],
  );

  return <context.Provider value={value}>{children}</context.Provider>;
};
