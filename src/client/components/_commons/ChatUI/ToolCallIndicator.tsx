import { useState } from "react";
import type { ToolUIPart } from "ai";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";
import { ArrowSLineIcon } from "@/components/_commons/Icones/ArrowSLineIcon";
import { CheckLineIcon } from "@/components/_commons/Icones/CheckLineIcon";
import { ErrorWarningIcon } from "@/components/_commons/Icones/ErrorWarningIcon";
import { PiloteUITools } from "@/server/albert/PiloteUIMessage";
import { AnimateEntry } from "@/components/shared/AnimateEntry";

type DataFetchingToolPart = Extract<
  ToolUIPart<PiloteUITools>,
  {
    type:
      | "tool-get_taux_avancement_territoire"
      | "tool-get_chantiers_en_retard"
      | "tool-get_chantiers_en_difficulte"
      | "tool-get_valeurs_indicateur";
  }
>;

const TOOL_LABELS: Record<DataFetchingToolPart["type"], string> = {
  "tool-get_taux_avancement_territoire":
    "Récupération du taux d'avancement du territoire",
  "tool-get_chantiers_en_retard": "Récupération des chantiers en retard",
  "tool-get_chantiers_en_difficulte":
    "Récupération des chantiers en difficulté",
  "tool-get_valeurs_indicateur": "Récupération des valeurs de l'indicateur",
};

const StatusIcon = ({ state }: { state: DataFetchingToolPart["state"] }) => {
  if (state === "output-error") {
    return <ErrorWarningIcon className="w-3 h-3 text-red-400" />;
  }
  if (state === "output-available") {
    return <CheckLineIcon className="w-3 h-3 text-green-500" />;
  }
  return (
    <span className="inline-flex gap-0.5">
      <span className="animate-bounce">.</span>
      <span className="animate-bounce [animation-delay:0.2s]">.</span>
      <span className="animate-bounce [animation-delay:0.4s]">.</span>
    </span>
  );
};

export const ToolCallIndicator = ({ part }: { part: DataFetchingToolPart }) => {
  const [expanded, setExpanded] = useState(false);

  const label = TOOL_LABELS[part.type] ?? part.type.replace("tool-", "");

  const hasOutput =
    part.state === "output-available" || part.state === "output-error";

  const inputData = part.input;
  const outputData = hasOutput ? (part as { output?: unknown }).output : null;

  return (
    <div className="text-gray-400 text-xs italic my-2">
      <button
        className="flex items-center gap-1 text-gray-400 cursor-pointer !p-0 hover:bg-transparent"
        onClick={() => setExpanded((prev) => !prev)}
        type="button"
      >
        <StatusIcon state={part.state} />
        <span>{label}</span>
        {hasOutput &&
          (expanded ? (
            <ArrowSLineIcon className="w-3 h-3" />
          ) : (
            <ArrowSLine2Icon className="w-3 h-3" />
          ))}
      </button>
      <AnimateEntry visible={expanded && hasOutput}>
        <pre className="bg-gray-50 text-gray-600 border border-gray-200 rounded p-2 text-[10px] mt-1 overflow-auto">
          Paramètres : {JSON.stringify(inputData, null, 2)}
        </pre>
        <pre className="bg-gray-50 text-gray-600 border border-gray-200 rounded p-2 text-[10px] mt-1 overflow-auto">
          Résultats : {JSON.stringify(outputData, null, 2)}
        </pre>
      </AnimateEntry>
    </div>
  );
};
