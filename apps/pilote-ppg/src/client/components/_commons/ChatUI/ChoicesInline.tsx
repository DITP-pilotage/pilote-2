import type { DisplayChoice } from "@/server/albert/tools/displayChoices";
import { useChatContext } from "@/components/_commons/ChatUI/ChatContext";
import { clsxm } from "@/utils/clsxm";

const CHOIX =
  "inline-flex h-9 items-center gap-2 bg-white px-3.5 text-sm font-medium transition-colors";

export const ChoicesInline = ({
  question,
  choices,
}: {
  question: string;
  choices: DisplayChoice[];
}) => {
  const { sendMessage, fillInput } = useChatContext();

  return (
    <div className="flex flex-col gap-3">
      {question && <p className="fr-mb-0">{question}</p>}
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => (
          <button
            className={clsxm(
              CHOIX,
              "text-primary shadow-[inset_0_0_0_1px_#000091] hover:bg-dsfr-alt-blue-france",
            )}
            key={choice.value}
            onClick={() => sendMessage({ text: choice.label })}
            type="button"
          >
            {choice.label}
          </button>
        ))}
        <button
          className={clsxm(
            CHOIX,
            "text-dsfr-grey-200 shadow-[inset_0_0_0_1px_#DDDDDD] hover:bg-dsfr-grey-1000",
          )}
          onClick={() => fillInput("")}
          type="button"
        >
          Autre…
        </button>
      </div>
    </div>
  );
};
