import { FormEvent, useEffect, useRef, useState } from "react";
import { marked } from "marked";
import { useChat, Chat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { clsxm } from "@/utils/clsxm";

const extractMessageText = (message: UIMessage): string => {
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

type ToolPart = {
  type: string;
  state?:
    | "input-streaming"
    | "input-available"
    | "output-streaming"
    | "output-available"
    | "output-error";
  input?: unknown;
  output?: unknown;
  error?: string;
};

const isToolPart = (part: unknown): part is ToolPart => {
  if (typeof part !== "object" || part === null) return false;
  const typedPart = part as { type?: string };
  return (
    typeof typedPart.type === "string" &&
    (typedPart.type.startsWith("tool-") || typedPart.type === "dynamic-tool")
  );
};

const ToolCallIndicator = ({ part }: { part: ToolPart }) => {
  const getToolName = () => {
    if (part.type === "dynamic-tool") return "outil";
    return part.type.replace("tool-", "").replace(/_/g, " ");
  };

  const getIndicatorContent = () => {
    const input = part.input as { territoire_code?: string } | undefined;
    const output = part.output as { territoire_nom?: string } | undefined;
    const territoireCode = input?.territoire_code || "";
    const territoireNom = output?.territoire_nom || territoireCode;

    if (part.state === "output-error") {
      return (
        <span className="text-red-400">
          Erreur lors de l'appel de {getToolName()}
          {part.error ? `: ${part.error}` : ""}
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

export const AlbertChat = () => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef(
    new Chat({
      transport: new DefaultChatTransport({ api: "/api/albert/chat" }),
    }),
  );

  const { messages, sendMessage, status, error } = useChat({
    chat: chatRef.current,
  });

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
  }, [messages]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || status === "submitted" || status === "streaming")
      return;

    setInput("");
    sendMessage({ text: trimmedInput });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-7xl">
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
      <h2 className="text-xl font-bold text-gray-900 mb-4">Albert</h2>
      <p className="text-sm text-gray-500 mb-4">
        Interrogez Albert sur les chantiers et leurs synthèses de résultats.
      </p>

      <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 mb-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-gray-400 text-center mt-8">
            Posez une question pour commencer la conversation.
          </p>
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
                <div className="max-w-[80%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap bg-primary text-white">
                  {extractMessageText(message)}
                </div>
              ) : (
                <div className="rounded-lg px-4 py-3 text-sm bg-white border border-gray-200 text-gray-900">
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
                    if (isToolPart(part)) {
                      return <ToolCallIndicator key={index} part={part} />;
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
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce [animation-delay:0.2s]">.</span>
                <span className="animate-bounce [animation-delay:0.4s]">.</span>
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-3 text-sm bg-red-50 border border-red-200 text-red-900">
              Erreur : {error.message}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="flex gap-2" onSubmit={handleSubmit}>
        <textarea
          className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={status === "submitted" || status === "streaming"}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit(event);
            }
          }}
          placeholder="Posez votre question sur un chantier..."
          rows={2}
          value={input}
        />
        <button
          className={clsxm(
            "self-end rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors",
            {
              "bg-primary hover:bg-primary/90":
                status !== "submitted" && status !== "streaming",
              "bg-gray-400 cursor-not-allowed":
                status === "submitted" || status === "streaming",
            },
          )}
          disabled={
            status === "submitted" || status === "streaming" || !input.trim()
          }
          type="submit"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
};
