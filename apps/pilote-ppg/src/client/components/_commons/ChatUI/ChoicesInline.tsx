import { useId, type ComponentProps } from "react";
import type { AnalyticsEventName } from "@/client/analytics/schema";
import { useChatContext } from "@/components/_commons/ChatUI/ChatContext";
import { Icone } from "@/components/_commons/Icone";
import { ArrowGoForwardContourIcon } from "@/components/_commons/Icones/ArrowGoForwardContourIcon";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import { PencilIcon } from "@/components/_commons/Icones/PencilIcon";
import { QuestionIcon } from "@/components/_commons/Icones/QuestionIcon";
import { clsxm } from "@/utils/clsxm";

type Choix = { label: string };

type Variante = {
  titre: string;
  icone: ComponentProps<typeof Icone>["icone"];
  evenement: AnalyticsEventName;
  autreDemande: boolean;
  className: string;
};

/**
 * La clarification bloque la réponse : elle attend un choix, et laisse écrire
 * autre chose. Les suites la prolongent : facultatives, plus discrètes, sous
 * la réponse (PIL-1950).
 */
const VARIANTES = {
  clarification: {
    titre: "Précisez votre demande",
    icone: QuestionIcon,
    evenement: "response.choice",
    autreDemande: true,
    className: "border-l-4 border-primary bg-dsfr-alt-blue-france p-4",
  },
  suites: {
    titre: "Pour aller plus loin",
    icone: ArrowGoForwardContourIcon,
    evenement: "response.suite",
    autreDemande: false,
    className: "border-t border-dsfr-grey-925 pt-3",
  },
} satisfies Record<string, Variante>;

export const ChoicesInline = ({
  variante = "clarification",
  question,
  choices,
  llmCallId,
}: {
  variante?: keyof typeof VARIANTES;
  question?: string;
  choices: Choix[];
  llmCallId: string | undefined;
}) => {
  const { sendMessage, fillInput, track } = useChatContext();
  const { titre, icone, evenement, autreDemande, className } =
    VARIANTES[variante];

  const selectChoice = (choice: Choix, index: number) => {
    track({
      action: "select",
      name: evenement,
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
      className={clsxm("flex flex-col gap-3", className)}
    >
      <div className="flex flex-col gap-1" id={questionId}>
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <Icone className="h-4 w-4 shrink-0 text-primary" icone={icone} />
          {titre}
        </span>
        {question && (
          <p className="mb-0 font-bold text-dsfr-grey-50">{question}</p>
        )}
      </div>

      <ul className="mb-0 flex list-none flex-col gap-2 p-0">
        {choices.map((choice, index) => (
          <li className="p-0" key={choice.label}>
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

      {autreDemande && (
        <button
          className="inline-flex items-center gap-1.5 self-start text-sm text-dsfr-grey-200 underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-dsfr-focus"
          onClick={writeOtherRequest}
          type="button"
        >
          <Icone className="h-4 w-4 shrink-0" icone={PencilIcon} />
          Autre chose ? Écrire ma demande
        </button>
      )}
    </section>
  );
};
