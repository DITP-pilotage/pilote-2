import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { AlbertModel } from "@/components/_commons/ChatUI/ChatInputForm";
import type { AlbertConversation } from "@/components/_commons/ChatUI/createAlbertConversation";
import { buildChantierUrl } from "@/components/_commons/ChatUI/buildChantierUrl";
import { ChantierLinksProvider } from "@/components/_commons/ChatUI/ChantierLinksContext";
import { clsxm } from "@/utils/clsxm";
import { ChatContextProvider } from "@/components/_commons/ChatUI/ChatContext";
import { UserMessage } from "@/components/_commons/ChatUI/UserMessage";
import { AssistantMessage } from "@/components/_commons/ChatUI/AssistantMessage";
import { SignatureAssistant } from "@/components/_commons/ChatUI/SignatureAssistant";
import { EvaluationReponse } from "@/components/_commons/ChatUI/EvaluationReponse";
import { ErreurReponse } from "@/components/_commons/ChatUI/ErreurReponse";
import { ChatInputForm } from "@/components/_commons/ChatUI/ChatInputForm";
import { chatMarkdownStyles } from "@/components/_commons/ChatUI/chatMarkdownStyles";
import { deriverEtatAssistant } from "@/components/_commons/ChatUI/deriverEtatAssistant";
import { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { ChatEmptyState } from "@/components/_commons/ChatUI/ChatEmptyState";
import type {
  ChatScenario,
  ChatScenarioGroup,
  ChatScenarios,
  ContexteAccueil,
} from "@/components/_commons/ChatUI/ChatEmptyState";
import { Icone } from "@/components/_commons/Icone";
import { ArrowDownCircleIcon } from "@/components/_commons/Icones/ArrowDownCircleIcon";

export type { ChatScenario, ChatScenarioGroup, ChatScenarios };

export const ChatUI = ({
  conversation,
  placeholder = "Posez votre question...",
  className = "h-[calc(100vh-200px)]",
  scenarios,
  contexteAccueil,
}: {
  conversation: AlbertConversation;
  placeholder?: string;
  className?: string;
  scenarios?: ChatScenarios;
  contexteAccueil?: ContexteAccueil;
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userHasScrolledRef = useRef(false);
  const prevMessageCountRef = useRef(0);
  const fillInputRef = useRef<((text: string) => void) | null>(null);
  // L'utilisateur a remonté le fil pendant qu'Albert répond : on n'auto-scrolle
  // plus et on lui propose de revenir en bas.
  const [decroche, setDecroche] = useState(false);

  const { messages, sendMessage, status, error, stop, regenerate } =
    useChat<PiloteUIMessage>({
      chat: conversation.chat,
      experimental_throttle: 250,
    });
  const enCours = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (messages.length === 0) return;

    if (messages.length !== prevMessageCountRef.current) {
      userHasScrolledRef.current = false;
      setDecroche(false);
      prevMessageCountRef.current = messages.length;
    }

    if (userHasScrolledRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    if (status !== "ready") {
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
    setDecroche(!isNearBottom);
  }, []);

  const suivreLaReponse = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    userHasScrolledRef.current = false;
    setDecroche(false);
    container.scrollTop = container.scrollHeight;
  }, []);

  const fillInput = useCallback((text: string) => {
    fillInputRef.current?.(text);
  }, []);

  const handleModelChange = useCallback(
    (model: AlbertModel) => {
      conversation.requestBody.model = model;
    },
    [conversation],
  );

  const chantierLinkOptions = useMemo(() => {
    const context = {
      territoireCode: conversation.requestBody.agentContext?.territoireCode,
      jalon: conversation.requestBody.agentContext?.jalon,
    };
    return {
      buildUrl: (chantierId: string) =>
        buildChantierUrl({ chantierId, context }),
    };
  }, [conversation]);

  return (
    <ChatContextProvider
      error={error}
      fillInput={fillInput}
      sendMessage={sendMessage}
      status={status}
      stop={stop}
    >
      <ChantierLinksProvider options={chantierLinkOptions}>
        <div className={clsxm("flex flex-col bg-white", className)}>
          <style>{chatMarkdownStyles}</style>

          <div className="relative min-h-0 flex-1">
            <div
              className="h-full overflow-y-auto"
              onScroll={handleScroll}
              ref={scrollContainerRef}
            >
              <div className="mx-auto flex min-h-full max-w-6xl flex-col px-4 pb-4 pt-7">
                {messages.length === 0 && scenarios && (
                  <ChatEmptyState
                    contexte={contexteAccueil}
                    scenarios={scenarios}
                  />
                )}

                <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                  {messages.map((message, index) => {
                    const estDernier = index === messages.length - 1;

                    if (message.role === "user") {
                      return (
                        <div className="flex justify-end" key={message.id}>
                          <UserMessage message={message} />
                        </div>
                      );
                    }

                    return (
                      <AssistantMessage
                        afficherChoix={estDernier && status === "ready"}
                        etat={
                          estDernier
                            ? deriverEtatAssistant({ message, status })
                            : null
                        }
                        evaluation={
                          estDernier && status === "ready" ? (
                            <EvaluationReponse chatId={conversation.chat.id} />
                          ) : undefined
                        }
                        isStreaming={estDernier && enCours}
                        key={message.id}
                        message={message}
                      />
                    );
                  })}

                  {status === "submitted" && (
                    <SignatureAssistant etat="reflechit" />
                  )}

                  {error && (
                    <ErreurReponse
                      message={error.message}
                      onReessayer={() => regenerate()}
                    />
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {decroche && enCours && (
              <button
                className="absolute bottom-4 left-1/2 inline-flex h-8 -translate-x-1/2 items-center gap-1.5 bg-dsfr-grey-50 px-3 text-xs font-medium text-white shadow-md hover:bg-dsfr-grey-200"
                onClick={suivreLaReponse}
                type="button"
              >
                <Icone
                  className="h-3.5 w-3.5 !text-current"
                  icone={ArrowDownCircleIcon}
                />
                Suivre la réponse
              </button>
            )}
          </div>

          <ChatInputForm
            fillInputRef={fillInputRef}
            onModelChange={handleModelChange}
            placeholder={placeholder}
          />
        </div>
      </ChantierLinksProvider>
    </ChatContextProvider>
  );
};
