import { useState } from "react";
import type { DisplayChoice } from "@/server/albert/Albert";

export const ChoicesButtons = ({
  choices,
  onSelect,
}: {
  choices: DisplayChoice[];
  onSelect: (choice: DisplayChoice) => void;
}) => {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <div className="flex flex-wrap gap-2 my-2">
      {choices.map((choice) => (
        <button
          className="rounded-full border border-primary text-primary px-3 py-1 text-sm hover:bg-primary hover:text-white transition-colors"
          key={choice.value}
          onClick={() => {
            setHidden(true);
            onSelect(choice);
          }}
          type="button"
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
};
