import { useId } from "react";
import type { ClarifyChoice } from "@/server/albert/tools/clarifyWithChoices";
import { useChatContext } from "@/components/_commons/ChatUI/ChatContext";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import { PencilIcon } from "@/components/_commons/Icones/PencilIcon";
import { QuestionIcon } from "@/components/_commons/Icones/QuestionIcon";

export const ChoicesInline = ({
  question,
  choices,
  llmCallId,
}: {
  question: string;
  choices: ClarifyChoice[];
  llmCallId: string | undefined;
}) => {
  const { sendMessage, fillInput, track } = useChatContext();

  const selectChoice = (choice: ClarifyChoice, index: number) => {
    track({
      action: "select",
      name: "response.choice",
      dimensions: { llm_call_id: llmCallId, position_choix: index + 1 },
    });
    sendMessage({ text: choice.label });
  };

  const writeOtherRequest = () => {
    track({
      action: "select",
      name: "response.choice.other",
      dimensions: { llm_call_id: llmCallId },
    });
    fillInput("");
  };
  const questionId = useId();

  return (
    <section
      aria-labelledby={questionId}
      className="flex flex-col gap-3 border-l-4 border-primary bg-dsfr-alt-blue-france p-4"
    >
      <div className="flex flex-col gap-1" id={questionId}>
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <Icone
            className="h-4 w-4 shrink-0 text-primary"
            icone={QuestionIcon}
          />
          Précisez votre demande
        </span>
        {question && (
          <p className="mb-0 font-bold text-dsfr-grey-50">{question}</p>
        )}
      </div>

      <ul className="mb-0 flex list-none flex-col gap-2 p-0">
        {choices.map((choice, index) => (
          <li className="p-0" key={choice.value}>
            <button
              className="group flex w-full items-center justify-between gap-3 bg-white px-4 py-2.5 text-left text-sm font-medium text-primary shadow-[inset_0_0_0_1px_#E3E3FD] transition-colors hover:bg-dsfr-blue-france-925 hover:shadow-[inset_0_0_0_1px_#000091] focus-visible:outline-2 focus-visible:outline-dsfr-focus"
              onClick={() => selectChoice(choice, index)}
              type="button"
            >
              {choice.label}
              <Icone
                className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                icone={ArrowLine1Icon}
              />
            </button>
          </li>
        ))}
      </ul>

      <button
        className="inline-flex items-center gap-1.5 self-start text-sm text-dsfr-grey-200 underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-dsfr-focus"
        onClick={writeOtherRequest}
        type="button"
      >
        <Icone className="h-4 w-4 shrink-0" icone={PencilIcon} />
        Autre chose ? Écrire ma demande
      </button>
    </section>
  );
};
