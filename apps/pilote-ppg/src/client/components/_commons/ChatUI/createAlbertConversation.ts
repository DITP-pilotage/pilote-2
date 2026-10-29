import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type ChatOnFinishCallback } from "ai";
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

export type AlbertDraft = { text: string };

export type AlbertConversation = {
  chat: Chat<PiloteUIMessage>;
  requestBody: AlbertRequestBody;
  /** Mutated in place: the text being typed survives a remount of the input
   * when the assistant switches between views. */
  draft: AlbertDraft;
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
  onFinish?: ChatOnFinishCallback<PiloteUIMessage>;
}): AlbertConversation => {
  // Referenced by the transport. The model stays a request parameter, but the
  // UI no longer offers a model selector (PIL-1900).
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
    onFinish,
  });

  return { chat, requestBody, draft: { text: "" } };
};
