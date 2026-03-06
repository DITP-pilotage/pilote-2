import { useState } from "react";
import type { DisplayChoice } from "@/server/albert/Albert";
import { useChatContext } from "@/components/_commons/ChatUI/ChatContext";

export const ChoicesButtons = ({ choices }: { choices: DisplayChoice[] }) => {
  const [hidden, setHidden] = useState(false);
  const { sendMessage } = useChatContext();

  if (hidden) return null;

  return (
    <div className="grid md:grid-cols-2 gap-2 my-2 max-w-3xl mx-auto">
      {choices.map((choice) => (
        <button
          className="rounded-full border border-primary text-primary px-3 py-1 text-sm hover:bg-primary hover:text-white transition-colors"
          key={choice.value}
          onClick={() => {
            setHidden(true);
            sendMessage({ text: choice.label });
          }}
          type="button"
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
};
