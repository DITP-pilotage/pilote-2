import type { ToolUIPart } from "ai";
import { PiloteUITools } from "@/server/albert/PiloteUIMessage";

type SyntheseTerritoireToolPart = Extract<
  ToolUIPart<PiloteUITools>,
  { type: "tool-get_synthese_territoire" }
>;

export const ToolCallIndicator = ({
  part,
}: {
  part: SyntheseTerritoireToolPart;
}) => {
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
