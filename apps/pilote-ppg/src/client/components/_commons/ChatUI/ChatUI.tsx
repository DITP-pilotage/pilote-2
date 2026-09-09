import { useCallback, useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import type { AlbertModel } from "@/components/_commons/ChatUI/ChatInputForm";
import type { ConversationAlbert } from "@/components/_commons/ChatUI/creerConversationAlbert";
import {
  extraireChantiersCites,
  type ChantierCite,
} from "@/components/_commons/ChatUI/extraireChantiersCites";
import { construireUrlChantier } from "@/components/_commons/ChatUI/construireUrlChantier";
import { clsxm } from "@/utils/clsxm";
import { ChatContextProvider } from "@/components/_commons/ChatUI/ChatContext";
import { UserMessage } from "@/components/_commons/ChatUI/UserMessage";
import { AssistantMessage } from "@/components/_commons/ChatUI/AssistantMessage";
import { AssistantLoader } from "@/components/_commons/ChatUI/AssistantLoader";
import { FeedbackBar } from "@/components/_commons/ChatUI/FeedbackBar";
import { ChatInputForm } from "@/components/_commons/ChatUI/ChatInputForm";
import { ChatExperimentationBanner } from "@/components/_commons/ChatUI/ChatExperimentationBanner";
import { chatMarkdownStyles } from "@/components/_commons/ChatUI/chatMarkdownStyles";
import { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { ChatEmptyState } from "@/components/_commons/ChatUI/ChatEmptyState";
import { ChoicesPanel } from "@/components/_commons/ChatUI/ChoicesPanel";
import type {
  ChatScenario,
  ChatScenarioGroup,
  ChatScenarios,
} from "@/components/_commons/ChatUI/ChatEmptyState";

export type { ChatScenario, ChatScenarioGroup, ChatScenarios };

export const ChatUI = ({
  conversation,
  placeholder = "Posez votre question...",
  className = "h-[calc(100vh-200px)]",
  scenarios,
  showExperimentationBanner = false,
}: {
  conversation: ConversationAlbert;
  placeholder?: string;
  className?: string;
  scenarios?: ChatScenarios;
  showExperimentationBanner?: boolean;
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userHasScrolledRef = useRef(false);
  const prevMessageCountRef = useRef(0);
  const fillInputRef = useRef<((text: string) => void) | null>(null);

  const { messages, sendMessage, status, error, stop } =
    useChat<PiloteUIMessage>({
      chat: conversation.chat,
      experimental_throttle: 250,
    });

  useEffect(() => {
    if (messages.length === 0) return;

    if (messages.length !== prevMessageCountRef.current) {
      userHasScrolledRef.current = false;
      prevMessageCountRef.current = messages.length;
    }

    if (userHasScrolledRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const isStreaming = status !== "ready";

    if (isStreaming) {
      container.scrollTop = container.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, status]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

    userHasScrolledRef.current = !isNearBottom;
  }, []);

  const fillInput = useCallback((text: string) => {
    fillInputRef.current?.(text);
  }, []);

  const handleModelChange = useCallback(
    (model: AlbertModel) => {
      conversation.corpsRequete.model = model;
    },
    [conversation],
  );

  const optionsLiensChantiers = useMemo(() => {
    const contexte = {
      territoireCode: conversation.corpsRequete.agentContext?.territoireCode,
      jalon: conversation.corpsRequete.agentContext?.jalon,
    };
    return {
      chantiers: extraireChantiersCites(messages),
      construireUrl: (chantier: ChantierCite) =>
        construireUrlChantier({ chantier, contexte }),
    };
  }, [messages, conversation]);

  const choicesPanelData = useMemo(() => {
    if (status !== "ready" || messages.length === 0) return null;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "assistant") return null;

    const choicesPart = lastMessage.parts?.findLast(
      (part) =>
        part.type === "tool-display_choices" &&
        part.state === "output-available",
    );

    if (!choicesPart || choicesPart.type !== "tool-display_choices")
      return null;
    if (choicesPart.state !== "output-available") return null;

    return {
      question: choicesPart.output.question,
      choices: choicesPart.output.choices,
    };
  }, [messages, status]);

  return (
    <ChatContextProvider
      error={error}
      fillInput={fillInput}
      optionsLiensChantiers={optionsLiensChantiers}
      sendMessage={sendMessage}
      status={status}
      stop={stop}
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
                  <AssistantLoader label="Réflexion en cours" />
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

        {choicesPanelData && (
          <ChoicesPanel
            question={choicesPanelData.question}
            choices={choicesPanelData.choices}
          />
        )}

        {messages.length > 0 && status === "ready" && (
          <FeedbackBar chatId={conversation.chat.id} />
        )}

        <ChatInputForm
          fillInputRef={fillInputRef}
          onModelChange={handleModelChange}
          placeholder={placeholder}
        />

        {showExperimentationBanner && <ChatExperimentationBanner />}
      </div>
    </ChatContextProvider>
  );
};
