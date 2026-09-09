import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ChatScenarios } from "@/components/_commons/ChatUI/ChatEmptyState";
import {
  creerConversationAlbert,
  type AgentContextAlbert,
  type ConversationAlbert,
} from "@/components/_commons/ChatUI/creerConversationAlbert";
import {
  ecrireConversationMinimisee,
  effacerConversationMinimisee,
  lireConversationMinimisee,
  type ConversationMinimisee,
} from "@/components/_commons/ChatUI/conversationMinimiseeStockage";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import api from "@/server/infrastructure/api/trpc/api";

export type AffichageAlbert = "plein-ecran" | "minimise";

export type ConversationCourante = ConversationAlbert & {
  agentContext: AgentContextAlbert;
  scenarios?: ChatScenarios;
};

type ChargementConversation = {
  demande: ConversationMinimisee;
  affichageCible: AffichageAlbert;
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
  const [chargement, setChargement] = useState<ChargementConversation | null>(
    null,
  );
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

  useEffect(() => {
    const stockee = lireConversationMinimisee();
    if (stockee) {
      setChargement({ demande: stockee, affichageCible: "minimise" });
    }
  }, []);

  const { data: conversationChargee, isError } =
    api.albert.conversations.recuperer.useQuery(
      { id: chargement?.demande.id ?? "" },
      { enabled: chargement !== null, retry: false },
    );

  useEffect(() => {
    if (!chargement) return;

    if (isError) {
      effacerConversationMinimisee();
      setChargement(null);
      return;
    }

    if (!conversationChargee) return;

    setConversation(
      construire({
        id: chargement.demande.id,
        agentContext: chargement.demande.agentContext,
        messages: conversationChargee.messages,
      }),
    );
    setAffichage(chargement.affichageCible);
    setChargement(null);
  }, [chargement, conversationChargee, isError, construire]);

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

  const minimiser = useCallback(() => {
    if (conversation) {
      ecrireConversationMinimisee({
        id: conversation.chat.id,
        agentContext: conversation.agentContext,
      });
    }
    setAffichage("minimise");
  }, [conversation]);

  const restaurer = useCallback(() => setAffichage("plein-ecran"), []);

  const fermer = useCallback(() => {
    conversation?.chat.stop();
    effacerConversationMinimisee();
    setConversation(null);
    setAffichage("plein-ecran");
  }, [conversation]);

  const demarrerNouvelleConversation = useCallback(() => {
    if (!conversation) return;
    conversation.chat.stop();
    effacerConversationMinimisee();
    setConversation(
      construire({
        id: crypto.randomUUID(),
        agentContext: conversation.agentContext,
        scenarios: conversation.scenarios,
      }),
    );
    setAffichage("plein-ecran");
  }, [conversation, construire]);

  const selectionnerConversation = useCallback(
    (id: string) => {
      if (!conversation) return;
      conversation.chat.stop();
      effacerConversationMinimisee();
      setChargement({
        demande: { id, agentContext: conversation.agentContext },
        affichageCible: "plein-ecran",
      });
    },
    [conversation],
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
      selectionnerConversation,
    }),
    [
      conversation,
      affichage,
      ouvrir,
      minimiser,
      restaurer,
      fermer,
      demarrerNouvelleConversation,
      selectionnerConversation,
    ],
  );

  return <context.Provider value={valeur}>{children}</context.Provider>;
};
