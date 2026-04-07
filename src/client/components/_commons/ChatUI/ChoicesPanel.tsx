import { FormEvent, useState } from "react";
import type { DisplayChoice } from "@/server/albert/Albert";
import { useChatContext } from "@/components/_commons/ChatUI/ChatContext";
import { ArrowLineIcon } from "@/components/_commons/Icones/ArrowLineIcon";

export const ChoicesPanel = ({
  question,
  choices,
}: {
  question: string;
  choices: DisplayChoice[];
}) => {
  const [autreText, setAutreText] = useState("");
  const { sendMessage } = useChatContext();

  const handleChoiceClick = (choice: DisplayChoice) => {
    sendMessage({ text: choice.label });
  };

  const handleAutreSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = autreText.trim();
    if (!trimmed) return;
    sendMessage({ text: trimmed });
  };

  return (
    <div className="shrink-0 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] animate-slide-up">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <p className="font-medium text-sm text-gray-900 mb-3">{question}</p>

        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto mb-3">
          {choices.map((choice) => (
            <button
              className="w-full text-left rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-800 hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
              key={choice.value}
              onClick={() => handleChoiceClick(choice)}
              type="button"
            >
              {choice.label}
            </button>
          ))}
        </div>

        <form className="flex gap-2" onSubmit={handleAutreSubmit}>
          <input
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            onChange={(event) => setAutreText(event.target.value)}
            placeholder="Autre..."
            type="text"
            value={autreText}
          />
          <button
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary text-white hover:bg-primary/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={!autreText.trim()}
            type="submit"
          >
            <ArrowLineIcon className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
