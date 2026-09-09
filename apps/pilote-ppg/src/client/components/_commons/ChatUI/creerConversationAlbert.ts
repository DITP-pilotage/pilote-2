import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { AlbertModel } from "@/components/_commons/ChatUI/ChatInputForm";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export type AgentContextAlbert = {
  territoireCode: string;
  jalon: number;
  instructions: string;
};

export type CorpsRequeteAlbert = {
  agentContext?: AgentContextAlbert;
  model: AlbertModel;
};

export type ConversationAlbert = {
  chat: Chat<PiloteUIMessage>;
  corpsRequete: CorpsRequeteAlbert;
};

export const ENDPOINT_ALBERT = "/api/albert/chat";

export const creerConversationAlbert = ({
  id,
  endpoint = ENDPOINT_ALBERT,
  agentContext,
  messages,
  onFinish,
}: {
  id: string;
  endpoint?: string;
  agentContext?: AgentContextAlbert;
  messages?: PiloteUIMessage[];
  onFinish?: () => void;
}): ConversationAlbert => {
  // Objet muté en place et référencé par le transport : le sélecteur de modèle
  // de ChatInputForm doit pouvoir le changer en cours de conversation.
  const corpsRequete: CorpsRequeteAlbert = {
    ...(agentContext ? { agentContext } : {}),
    model: "openweight-large",
  };

  const chat = new Chat<PiloteUIMessage>({
    id,
    ...(messages ? { messages } : {}),
    transport: new DefaultChatTransport<PiloteUIMessage>({
      api: endpoint,
      body: corpsRequete,
    }),
    onFinish: () => onFinish?.(),
  });

  return { chat, corpsRequete };
};
