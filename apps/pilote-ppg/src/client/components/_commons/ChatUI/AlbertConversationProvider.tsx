import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ChatScenarios } from "@/components/_commons/ChatUI/ChatEmptyState";
import {
  creerConversationAlbert,
  type AgentContextAlbert,
  type ConversationAlbert,
} from "@/components/_commons/ChatUI/creerConversationAlbert";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import api from "@/server/infrastructure/api/trpc/api";

export type AffichageAlbert = "plein-ecran" | "minimise";

export type ConversationCourante = ConversationAlbert & {
  agentContext: AgentContextAlbert;
  scenarios?: ChatScenarios;
};

type AlbertConversationContextValue = {
  conversation: ConversationCourante | null;
  affichage: AffichageAlbert;
  ouvrir: (params: {
    agentContext: AgentContextAlbert;
    scenarios: ChatScenarios;
  }) => void;
  minimiser: () => void;
  restaurer: () => void;
  fermer: () => void;
  demarrerNouvelleConversation: () => void;
  selectionnerConversation: (id: string) => void;
};

const context = createContext<AlbertConversationContextValue | null>(null);

export const useAlbertConversation = (): AlbertConversationContextValue => {
  const valeur = useContext(context);
  if (!valeur) {
    throw new Error(
      "useAlbertConversation doit être utilisé dans un AlbertConversationProvider !",
    );
  }
  return valeur;
};

export const AlbertConversationProvider = ({ children }: PropsWithChildren) => {
  const [conversation, setConversation] = useState<ConversationCourante | null>(
    null,
  );
  const [affichage, setAffichage] = useState<AffichageAlbert>("plein-ecran");
  const utilsTrpc = api.useUtils();

  const construire = useCallback(
    ({
      id,
      agentContext,
      scenarios,
      messages,
    }: {
      id: string;
      agentContext: AgentContextAlbert;
      scenarios?: ChatScenarios;
      messages?: PiloteUIMessage[];
    }): ConversationCourante => ({
      ...creerConversationAlbert({
        id,
        agentContext,
        messages,
        onFinish: () => utilsTrpc.albert.conversations.lister.invalidate(),
      }),
      agentContext,
      scenarios,
    }),
    [utilsTrpc],
  );

  const ouvrir = useCallback<AlbertConversationContextValue["ouvrir"]>(
    ({ agentContext, scenarios }) => {
      setConversation(
        (courante) =>
          courante ??
          construire({ id: crypto.randomUUID(), agentContext, scenarios }),
      );
      setAffichage("plein-ecran");
    },
    [construire],
  );

  const minimiser = useCallback(() => setAffichage("minimise"), []);
  const restaurer = useCallback(() => setAffichage("plein-ecran"), []);

  const fermer = useCallback(() => {
    conversation?.chat.stop();
    setConversation(null);
    setAffichage("plein-ecran");
  }, [conversation]);

  const remplacer = useCallback(
    (id: string) => {
      if (!conversation) return;
      conversation.chat.stop();
      setConversation(
        construire({
          id,
          agentContext: conversation.agentContext,
          scenarios: conversation.scenarios,
        }),
      );
      setAffichage("plein-ecran");
    },
    [conversation, construire],
  );

  const demarrerNouvelleConversation = useCallback(
    () => remplacer(crypto.randomUUID()),
    [remplacer],
  );

  const valeur = useMemo(
    () => ({
      conversation,
      affichage,
      ouvrir,
      minimiser,
      restaurer,
      fermer,
      demarrerNouvelleConversation,
      selectionnerConversation: remplacer,
    }),
    [
      conversation,
      affichage,
      ouvrir,
      minimiser,
      restaurer,
      fermer,
      demarrerNouvelleConversation,
      remplacer,
    ],
  );

  return <context.Provider value={valeur}>{children}</context.Provider>;
};
