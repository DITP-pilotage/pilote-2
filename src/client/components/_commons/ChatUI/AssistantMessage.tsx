import { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { ToolCallIndicator } from "@/components/_commons/ChatUI/ToolCallIndicator";
import { AssistantMessageText } from "@/components/_commons/ChatUI/AssistantMessageText";
import { ChoicesButtons } from "@/components/_commons/ChatUI/ChoicesButtons";
import { ValeursIndicateurTable } from "@/components/_commons/ChatUI/ValeursIndicateurTable";

export const AssistantMessage = ({
  message,
  isStreaming,
}: {
  message: PiloteUIMessage;
  isStreaming: boolean;
}) => {
  const hasText = message.parts?.some(
    (part) => part.type === "text" && part.text.trim().length > 0,
  );

  const hasDisplayTool = message.parts?.some(
    (part) =>
      (part.type === "tool-display_valeurs_indicateur" ||
        part.type === "tool-display_choices") &&
      part.state === "output-available",
  );

  return (
    <div className="text-sm text-gray-900 w-full">
      <div className="max-w-3xl mx-auto">
        {message.parts?.map((part, index) => {
          if (
            part.type === "tool-get_synthese_territoire" ||
            part.type === "tool-get_valeurs_indicateur"
          ) {
            return <ToolCallIndicator key={index} part={part} />;
          }
          return null;
        })}
        {message.parts?.map((part, index) => {
          if (part.type === "text") {
            return <AssistantMessageText key={index} text={part.text} />;
          }
          return null;
        })}

        {isStreaming && hasDisplayTool && (
          <span className="inline-flex gap-1 text-gray-500">
            <span className="animate-bounce">.</span>
            <span className="animate-bounce [animation-delay:0.2s]">.</span>
            <span className="animate-bounce [animation-delay:0.4s]">.</span>
          </span>
        )}
      </div>

      {!isStreaming &&
        message.parts?.map((part, index) => {
          if (part.type === "tool-display_valeurs_indicateur") {
            if (part.state !== "output-available") return null;
            return (
              <div
                key={index}
                className="animate-fade-in bg-white p-2 shadow-lg rounded-lg border border-gray-300/30 my-4"
              >
                <ValeursIndicateurTable indicateurs={part.output.indicateurs} />
              </div>
            );
          }
          return null;
        })}
      {!isStreaming &&
        hasText &&
        message.parts?.map((part, index) => {
          if (part.type === "tool-display_choices") {
            if (part.state !== "output-available") return null;
            return (
              <div key={index} className="animate-fade-in">
                <ChoicesButtons choices={part.output.choices} />
              </div>
            );
          }
          return null;
        })}
    </div>
  );
};
