import { useCallback, useEffect, useRef } from "react";
import { Chat, useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { clsxm } from "@/utils/clsxm";
import { ChatContextProvider } from "@/components/_commons/ChatUI/ChatContext";
import { UserMessage } from "@/components/_commons/ChatUI/UserMessage";
import { AssistantMessage } from "@/components/_commons/ChatUI/AssistantMessage";
import { AssistantLoader } from "@/components/_commons/ChatUI/AssistantLoader";
import { FeedbackBar } from "@/components/_commons/ChatUI/FeedbackBar";
import { ChatInputForm } from "@/components/_commons/ChatUI/ChatInputForm";
import { chatMarkdownStyles } from "@/components/_commons/ChatUI/chatMarkdownStyles";
import { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { ChatEmptyState } from "@/components/_commons/ChatUI/ChatEmptyState";
import type { ChatScenario } from "@/components/_commons/ChatUI/ChatEmptyState";

export type { ChatScenario };

export const ChatUI = ({
  endpoint,
  placeholder = "Posez votre question...",
  className = "h-[calc(100vh-200px)]",
  scenarios = [],
  agentContext,
}: {
  endpoint: string;
  placeholder?: string;
  className?: string;
  scenarios?: ChatScenario[];
  agentContext?: Record<string, unknown>;
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastAssistantMessageRef = useRef<HTMLDivElement>(null);
  const fillInputRef = useRef<((text: string) => void) | null>(null);
  const chatRef = useRef(
    new Chat<PiloteUIMessage>({
      transport: new DefaultChatTransport<PiloteUIMessage>({
        api: endpoint,
        body: agentContext ? { agentContext } : undefined,
      }),
    }),
  );

  const { messages, sendMessage, status, error } = useChat<PiloteUIMessage>({
    chat: chatRef.current,
  });

  useEffect(() => {
    if (messages.length === 0) return;

    setTimeout(() => {
      const container = scrollContainerRef.current;
      const lastMessage = lastAssistantMessageRef.current;

      if (container && lastMessage) {
        const containerRect = container.getBoundingClientRect();
        const messageRect = lastMessage.getBoundingClientRect();

        if (messageRect.top < containerRect.top + 60) return;
      }

      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  const fillInput = useCallback((text: string) => {
    fillInputRef.current?.(text);
  }, []);

  return (
    <ChatContextProvider
      error={error}
      fillInput={fillInput}
      sendMessage={sendMessage}
      status={status}
    >
      <div className={clsxm("flex flex-col", className)}>
        <style>{chatMarkdownStyles}</style>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto bg-white"
        >
          <div className="max-w-6xl mx-auto p-4 space-y-4">
            {messages.length === 0 && scenarios.length > 0 && (
              <ChatEmptyState scenarios={scenarios} />
            )}

            {messages.map((message, index) => {
              const isLastAssistant =
                message.role === "assistant" && index === messages.length - 1;
              return (
                <div
                  key={message.id}
                  ref={isLastAssistant ? lastAssistantMessageRef : undefined}
                >
                  {message.role === "user" ? (
                    <div className="max-w-3xl mx-auto flex justify-end">
                      <UserMessage message={message} />
                    </div>
                  ) : (
                    <AssistantMessage
                      message={message}
                      isStreaming={
                        index === messages.length - 1 && status !== "ready"
                      }
                    />
                  )}
                </div>
              );
            })}

            {status === "submitted" && (
              <div className="max-w-3xl mx-auto flex justify-start">
                <div className="text-sm text-gray-500">
                  <AssistantLoader />
                </div>
              </div>
            )}

            {error && (
              <div className="max-w-3xl mx-auto flex justify-start">
                <div className="max-w-[80%] text-sm text-red-600">
                  Erreur : {error.message}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {messages.length > 0 && status === "ready" && (
          <FeedbackBar chatId={chatRef.current.id} />
        )}

        <ChatInputForm fillInputRef={fillInputRef} placeholder={placeholder} />
      </div>
    </ChatContextProvider>
  );
};
