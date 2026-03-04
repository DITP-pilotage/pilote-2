import { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { ToolCallIndicator } from "@/components/_commons/ChatUI/ToolCallIndicator";
import { AssistantMessageText } from "@/components/_commons/ChatUI/AssistantMessageText";
import { ChoicesButtons } from "@/components/_commons/ChatUI/ChoicesButtons";
import { ValeursIndicateurTable } from "@/components/_commons/ChatUI/ValeursIndicateurTable";

export const AssistantMessage = ({ message }: { message: PiloteUIMessage }) => {
  const hasText = message.parts?.some(
    (part) => part.type === "text" && part.text.trim().length > 0,
  );

  return (
    <div className="text-sm text-gray-900">
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
      {message.parts?.map((part, index) => {
        if (part.type === "tool-display_valeurs_indicateur") {
          if (part.state !== "output-available") return null;
          return (
            <ValeursIndicateurTable
              key={index}
              indicateurs={part.output.indicateurs}
            />
          );
        }
        return null;
      })}
      {hasText &&
        message.parts?.map((part, index) => {
          if (part.type === "tool-display_choices") {
            if (part.state !== "output-available") return null;
            return <ChoicesButtons choices={part.output.choices} key={index} />;
          }
          return null;
        })}
    </div>
  );
};
