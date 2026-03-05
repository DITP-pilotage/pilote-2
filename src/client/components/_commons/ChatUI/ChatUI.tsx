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
import type {
  ChatScenario,
  ChatScenarioGroup,
  ChatScenarios,
} from "@/components/_commons/ChatUI/ChatEmptyState";

export type { ChatScenario, ChatScenarioGroup, ChatScenarios };

export const ChatUI = ({
  endpoint,
  placeholder = "Posez votre question...",
  className = "h-[calc(100vh-200px)]",
  scenarios,
  agentContext,
}: {
  endpoint: string;
  placeholder?: string;
  className?: string;
  scenarios?: ChatScenarios;
  agentContext?: Record<string, unknown>;
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userHasScrolledRef = useRef(false);
  const prevMessageCountRef = useRef(0);
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
    if (messages.length !== prevMessageCountRef.current) {
      userHasScrolledRef.current = false;
      prevMessageCountRef.current = messages.length;
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) return;
    if (userHasScrolledRef.current) return;

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

    if (!isNearBottom) {
      userHasScrolledRef.current = true;
    }
  }, []);

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
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-white"
        >
          <div className="max-w-6xl mx-auto p-4 space-y-4">
            {messages.length === 0 && scenarios && (
              <ChatEmptyState scenarios={scenarios} />
            )}

            {messages.map((message, index) => {
              return (
                <div key={message.id}>
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
