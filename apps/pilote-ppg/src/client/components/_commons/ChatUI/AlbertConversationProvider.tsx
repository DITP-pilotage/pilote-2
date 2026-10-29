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
  exportsAvailableEvents,
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

// Ce que la page affichée donne à l'assistant. Une page qui n'en déclare pas
// ouvre une conversation sans contexte.
export type AlbertPageContext = {
  agentContext: AlbertAgentContext;
  scenarios: ChatScenarios;
};

type AlbertConversationContextValue = {
  conversation: CurrentConversation | null;
  /** Ce qui est réellement affiché, compte tenu de la largeur de l'écran. */
  display: AffichageAssistant;
  /** Les vues qui tiennent sur l'écran, proposées par le sélecteur de vue. */
  vuesDisponibles: readonly VueAssistant[];
  pageContext: AlbertPageContext | null;
  setPageContext: (pageContext: AlbertPageContext | null) => void;
  open: () => void;
  changerVue: (vue: VueAssistant) => void;
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

// Monté au-dessus de toute la page (le panneau latéral en est la colonne de
// droite) : il n'agit qu'une fois l'utilisateur connecté.
export const AlbertConversationProvider = ({
  actif,
  children,
}: PropsWithChildren<{ actif: boolean }>) => {
  const [conversation, setConversation] = useState<CurrentConversation | null>(
    null,
  );
  const [affichage, setAffichage] = useState<AffichageAssistant>("modal");
  // Ce que « Reprendre » rouvre depuis le dock.
  const [vueAvantReduction, setVueAvantReduction] =
    useState<VueAssistant>("modal");
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
      agentContext,
      targetDisplay,
    }: {
      id: string;
      agentContext?: AlbertAgentContext;
      targetDisplay: AffichageAssistant;
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
        setAffichage(targetDisplay);
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

    load({
      id: stored.id,
      agentContext: stored.agentContext,
      targetDisplay: "minimized",
    });
  }, [actif, load]);

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
    // La modale tient sur tous les écrans : c'est elle qu'on découvre, tant
    // qu'aucune autre vue n'a été choisie sur cet appareil.
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
    if (affichage !== "minimized") setVueAvantReduction(affichage);
    setAffichage("minimized");
  }, [affichage, conversation, track]);

  const restore = useCallback(() => {
    track({
      action: "resume",
      name: "assistant.resume",
      dimensions: { conversation_id: conversation?.chat.id },
    });
    setAffichage(vueAvantReduction);
  }, [conversation, track, vueAvantReduction]);

  // Il n'y a plus de « Fermer » : repartir de zéro, c'est démarrer une
  // nouvelle conversation, avec le contexte de la page affichée.
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
      load({
        id,
        agentContext: conversation.agentContext,
        targetDisplay: affichage,
      });
    },
    [affichage, conversation, load, track],
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
      minimize,
      restore,
      startNewConversation,
      selectConversation,
    ],
  );

  return <context.Provider value={value}>{children}</context.Provider>;
};
