import { FormEvent, useRef, useState } from "react";
import { marked } from "marked";
import { clsxm } from "@/utils/clsxm";
import api from "@/server/infrastructure/api/trpc/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AlbertChat = () => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mutation = api.albert.chat.useMutation({
    onSuccess: (data) => {
      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: data.text },
      ]);
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    },
    onError: (error) => {
      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: `Erreur : ${error.message}` },
      ]);
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || mutation.isPending) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", content: trimmedPrompt },
    ]);
    setPrompt("");
    mutation.mutate({ prompt: trimmedPrompt });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl">
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

        {messages.map((message, index) => (
          <div
            className={clsxm("flex", {
              "justify-end": message.role === "user",
              "justify-start": message.role === "assistant",
            })}
            key={index}
          >
            {message.role === "user" ? (
              <div className="max-w-[80%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap bg-primary text-white">
                {message.content}
              </div>
            ) : (
              <div
                className="max-w-[80%] rounded-lg px-4 py-3 text-sm bg-white border border-gray-200 text-gray-900 albert-markdown"
                dangerouslySetInnerHTML={{
                  __html: marked.parse(message.content, {
                    async: false,
                  }) as string,
                }}
              />
            )}
          </div>
        ))}

        {mutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500">
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

        <div ref={messagesEndRef} />
      </div>

      <form className="flex gap-2" onSubmit={handleSubmit}>
        <textarea
          className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={mutation.isPending}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit(event);
            }
          }}
          placeholder="Posez votre question sur un chantier..."
          rows={2}
          value={prompt}
        />
        <button
          className={clsxm(
            "self-end rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors",
            {
              "bg-primary hover:bg-primary/90": !mutation.isPending,
              "bg-gray-400 cursor-not-allowed": mutation.isPending,
            },
          )}
          disabled={mutation.isPending || !prompt.trim()}
          type="submit"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
};
