import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { AlbertModel } from "@/components/_commons/ChatUI/ChatInputForm";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export type AlbertAgentContext = {
  territoireCode: string;
  jalon: number;
  instructions: string;
};

export type AlbertRequestBody = {
  agentContext?: AlbertAgentContext;
  model: AlbertModel;
};

export type AlbertConversation = {
  chat: Chat<PiloteUIMessage>;
  requestBody: AlbertRequestBody;
};

export const ALBERT_ENDPOINT = "/api/albert/chat";

export const createAlbertConversation = ({
  id,
  endpoint = ALBERT_ENDPOINT,
  agentContext,
  messages,
  onFinish,
}: {
  id: string;
  endpoint?: string;
  agentContext?: AlbertAgentContext;
  messages?: PiloteUIMessage[];
  onFinish?: () => void;
}): AlbertConversation => {
  // Mutated in place and referenced by the transport: the model selector in
  // ChatInputForm must be able to switch models mid-conversation.
  const requestBody: AlbertRequestBody = {
    ...(agentContext ? { agentContext } : {}),
    model: "openweight-large",
  };

  const chat = new Chat<PiloteUIMessage>({
    id,
    ...(messages ? { messages } : {}),
    transport: new DefaultChatTransport<PiloteUIMessage>({
      api: endpoint,
      body: requestBody,
    }),
    onFinish: () => onFinish?.(),
  });

  return { chat, requestBody };
};
