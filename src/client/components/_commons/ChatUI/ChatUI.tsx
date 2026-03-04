import { FormEvent, useEffect, useRef, useState } from "react";
import { marked } from "marked";
import { Chat, useChat } from "@ai-sdk/react";
import type { ToolUIPart, UIDataTypes, UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { $Enums } from "@prisma/client";
import type { DisplayChoice } from "@/server/albert/Albert";
import type { GetSyntheseTerritoireOutput } from "@/server/albert/tools/getSyntheseTerritoire";
import { clsxm } from "@/utils/clsxm";
import { ArrowLineIcon } from "@/components/_commons/Icones/ArrowLineIcon";
import { FeedbackNegatifModale } from "@/components/_commons/ChatUI/FeedbackNegatifModale";
import api from "@/server/infrastructure/api/trpc/api";
import { ChoicesButtons } from "@/components/_commons/ChatUI/ChoicesButtons";

type PiloteUITools = {
  display_choices: {
    input: { choices: DisplayChoice[] };
    output: { choices: DisplayChoice[] };
  };
  get_synthese_territoire: {
    input: { territoire_code: string };
    output: GetSyntheseTerritoireOutput;
  };
};

type PiloteUIMessage = UIMessage<unknown, UIDataTypes, PiloteUITools>;

type SyntheseTerritoireToolPart = Extract<
  ToolUIPart<PiloteUITools>,
  { type: "tool-get_synthese_territoire" }
>;

const extractMessageText = (message: PiloteUIMessage): string => {
  if (!message.parts) return "";
  return message.parts
    .map((part) => {
      if (part.type === "text") {
        return part.text;
      }
      return "";
    })
    .join("");
};

const ToolCallIndicator = ({ part }: { part: SyntheseTerritoireToolPart }) => {
  const getIndicatorContent = () => {
    const territoireCode =
      part.state !== "input-streaming"
        ? (part.input?.territoire_code ?? "")
        : "";
    const territoireNom =
      part.state === "output-available"
        ? (part.output?.territoire_nom ?? territoireCode)
        : territoireCode;

    if (part.state === "output-error") {
      return (
        <span className="text-red-400">
          Erreur lors de la récupération des données du territoire
        </span>
      );
    }

    if (part.state === "output-available") {
      return (
        <span>Données récupérées pour {territoireNom || "le territoire"}</span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1">
        <span>
          Recherche des données pour {territoireCode || "le territoire"}...
        </span>
        <span className="inline-flex gap-0.5">
          <span className="animate-bounce">.</span>
          <span className="animate-bounce [animation-delay:0.2s]">.</span>
          <span className="animate-bounce [animation-delay:0.4s]">.</span>
        </span>
      </span>
    );
  };

  return (
    <p className="text-gray-400 text-xs italic my-2">{getIndicatorContent()}</p>
  );
};

export const ChatUI = ({
  endpoint,
  placeholder = "Posez votre question...",
  emptyStateText = "Posez une question pour commencer la conversation.",
  className = "h-[calc(100vh-200px)]",
  initialMessage,
}: {
  endpoint: string;
  placeholder?: string;
  emptyStateText?: string;
  className?: string;
  initialMessage?: string;
}) => {
  const [input, setInput] = useState("");
  const [evaluationSoumise, setEvaluationSoumise] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSubmittedInitialMessage = useRef(false);
  const chatRef = useRef(
    new Chat<PiloteUIMessage>({
      transport: new DefaultChatTransport<PiloteUIMessage>({ api: endpoint }),
    }),
  );

  const { messages, sendMessage, status, error } = useChat<PiloteUIMessage>({
    chat: chatRef.current,
  });

  const evaluerMutation = api.albert.evaluer.useMutation({
    onSuccess: () => setEvaluationSoumise(true),
  });

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
  }, [messages]);

  useEffect(() => {
    if (initialMessage && !hasSubmittedInitialMessage.current) {
      hasSubmittedInitialMessage.current = true;
      sendMessage({ text: initialMessage });
    }
  }, [initialMessage, sendMessage]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || status === "submitted" || status === "streaming")
      return;

    setInput("");
    sendMessage({ text: trimmedInput });
  };

  return (
    <div className={clsxm("flex flex-col", className)}>
      <style>
        {`
          .albert-markdown h1, .albert-markdown h2, .albert-markdown h3 {
            font-weight: 700;
            margin-top: 0.75em;
            margin-bottom: 0.25em;
          }
          .albert-markdown h1 { font-size: 1.25em; }
          .albert-markdown h2 { font-size: 1.1em; }
          .albert-markdown h3 { font-size: 1em; }
          .albert-markdown p { margin: 0.5em 0; }
          .albert-markdown ul, .albert-markdown ol {
            padding-left: 1.5em;
            margin: 0.5em 0;
          }
          .albert-markdown ul { list-style: disc; }
          .albert-markdown ol { list-style: decimal; }
          .albert-markdown li { margin: 0.25em 0; }
          .albert-markdown table {
            border-collapse: collapse;
            width: 100%;
            margin: 0.75em 0;
            font-size: 0.875em;
          }
          .albert-markdown th, .albert-markdown td {
            border: 1px solid #d1d5db;
            padding: 0.5em 0.75em;
            text-align: left;
          }
          .albert-markdown th {
            background: #f3f4f6;
            font-weight: 600;
          }
          .albert-markdown code {
            background: #f3f4f6;
            padding: 0.15em 0.4em;
            border-radius: 0.25em;
            font-size: 0.9em;
          }
          .albert-markdown pre {
            background: #1f2937;
            color: #f9fafb;
            padding: 0.75em 1em;
            border-radius: 0.375em;
            overflow-x: auto;
            margin: 0.75em 0;
          }
          .albert-markdown pre code {
            background: transparent;
            padding: 0;
          }
          .albert-markdown strong { font-weight: 700; }
          .albert-markdown blockquote {
            border-left: 3px solid #d1d5db;
            padding-left: 0.75em;
            margin: 0.5em 0;
            color: #6b7280;
          }
        `}
      </style>

      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-3xl mx-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-gray-400 text-center mt-8">{emptyStateText}</p>
          )}

          {messages.map((message) => {
            return (
              <div
                className={clsxm("flex", {
                  "justify-end": message.role === "user",
                  "justify-start": message.role === "assistant",
                })}
                key={message.id}
              >
                {message.role === "user" ? (
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3 text-sm whitespace-pre-wrap bg-primary text-white">
                    {extractMessageText(message)}
                  </div>
                ) : (
                  <div className="text-sm text-gray-900">
                    {message.parts?.map((part, index) => {
                      if (part.type === "tool-get_synthese_territoire") {
                        return <ToolCallIndicator key={index} part={part} />;
                      }
                      return null;
                    })}
                    {message.parts?.map((part, index) => {
                      if (part.type === "text") {
                        return (
                          <div
                            key={index}
                            className="albert-markdown"
                            dangerouslySetInnerHTML={{
                              __html: marked.parse(part.text, {
                                async: false,
                              }) as string,
                            }}
                          />
                        );
                      }
                      return null;
                    })}
                    {message.parts?.some(
                      (part) =>
                        part.type === "text" && part.text.trim().length > 0,
                    ) &&
                      message.parts?.map((part, index) => {
                        if (part.type === "tool-display_choices") {
                          if (part.state !== "output-available") return null;
                          return (
                            <ChoicesButtons
                              choices={part.output.choices}
                              key={index}
                              onSelect={(choice) =>
                                sendMessage({ text: choice.label })
                              }
                            />
                          );
                        }
                        return null;
                      })}
                  </div>
                )}
              </div>
            );
          })}

          {status === "submitted" && (
            <div className="flex justify-start">
              <div className="text-sm text-gray-500">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce [animation-delay:0.2s]">
                    .
                  </span>
                  <span className="animate-bounce [animation-delay:0.4s]">
                    .
                  </span>
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-start">
              <div className="max-w-[80%] text-sm text-red-600">
                Erreur : {error.message}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {messages.length > 0 && status === "ready" && (
        <div className="shrink-0 border-t border-gray-100 px-4 py-2 bg-white">
          <div className="max-w-3xl mx-auto flex items-center gap-3 text-sm text-gray-500">
            {!evaluationSoumise ? (
              <>
                <span>Trouvez-vous l'assistant utile ?</span>
                <button
                  className="rounded-full border border-gray-300 px-3 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  disabled={evaluerMutation.isPending}
                  onClick={() =>
                    evaluerMutation.mutate({
                      chatId: chatRef.current.id,
                      evaluation: $Enums.llm_call_evaluation.POSITIVE,
                    })
                  }
                  type="button"
                >
                  Oui
                </button>
                <FeedbackNegatifModale
                  chatId={chatRef.current.id}
                  disabled={evaluerMutation.isPending}
                  onSuccess={() => setEvaluationSoumise(true)}
                />
              </>
            ) : (
              <span>Merci pour votre retour !</span>
            )}
          </div>
        </div>
      )}

      <div className="shrink-0 border-t border-gray-100 p-4 bg-white">
        <form className="max-w-3xl mx-auto relative" onSubmit={handleSubmit}>
          <textarea
            className="w-full resize-none rounded-xl border border-gray-200 pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={status === "submitted" || status === "streaming"}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
            placeholder={placeholder}
            rows={2}
            value={input}
          />
          <button
            className={clsxm(
              "absolute bottom-4 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              {
                "bg-primary text-white hover:bg-primary/90":
                  status !== "submitted" &&
                  status !== "streaming" &&
                  input.trim(),
                "bg-gray-300 text-white cursor-not-allowed":
                  status === "submitted" ||
                  status === "streaming" ||
                  !input.trim(),
              },
            )}
            disabled={
              status === "submitted" || status === "streaming" || !input.trim()
            }
            type="submit"
          >
            <ArrowLineIcon className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
