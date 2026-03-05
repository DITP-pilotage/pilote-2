import { toast } from "sonner";
import { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { ToolCallIndicator } from "@/components/_commons/ChatUI/ToolCallIndicator";
import { AssistantMessageText } from "@/components/_commons/ChatUI/AssistantMessageText";
import { AssistantLoader } from "@/components/_commons/ChatUI/AssistantLoader";
import { BaseDisplayTool } from "@/components/_commons/ChatUI/BaseDisplayTool";
import { ChoicesButtons } from "@/components/_commons/ChatUI/ChoicesButtons";
import { ExportRapportDownload } from "@/components/_commons/ChatUI/ExportRapportDownload";
import { ValeursIndicateurTable } from "@/components/_commons/ChatUI/ValeursIndicateurTable";
import { extractMessageText } from "@/components/_commons/ChatUI/utils";
import { Icone } from "@/components/_commons/Icone";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";

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
        part.type === "tool-display_choices" ||
        part.type === "tool-export_rapport") &&
      part.state === "output-available",
  );

  const hasCompletedDataFetchingTool = message.parts?.some(
    (part) =>
      (part.type === "tool-get_taux_avancement_territoire" ||
        part.type === "tool-get_chantiers_en_retard" ||
        part.type === "tool-get_chantiers_en_difficulte" ||
        part.type === "tool-get_valeurs_indicateur") &&
      part.state === "output-available",
  );

  return (
    <div className="text-sm text-gray-900 w-full">
      <div className="max-w-3xl mx-auto">
        {message.parts?.map((part, index) => {
          if (
            part.type === "tool-get_taux_avancement_territoire" ||
            part.type === "tool-get_chantiers_en_retard" ||
            part.type === "tool-get_chantiers_en_difficulte" ||
            part.type === "tool-get_valeurs_indicateur"
          ) {
            return <ToolCallIndicator key={index} part={part} />;
          }
          return null;
        })}
        {isStreaming && !hasText && hasCompletedDataFetchingTool && (
          <AssistantLoader />
        )}
        <div className="relative group">
          {message.parts?.map((part, index) => {
            if (part.type === "text") {
              return <AssistantMessageText key={index} text={part.text} />;
            }
            return null;
          })}
          {!isStreaming && hasText && (
            <button
              className="absolute top-1 right-1 p-1 rounded bg-white/80 text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                navigator.clipboard
                  .writeText(extractMessageText(message))
                  .then(() => {
                    toast.success("Texte copié dans le presse-papiers", {
                      duration: 3000,
                    });
                  });
              }}
              title="Copier dans le presse-papiers"
              type="button"
            >
              <Icone className="w-4 h-4" icone={ClipboardIcon} />
            </button>
          )}
        </div>

        {isStreaming && hasDisplayTool && <AssistantLoader />}
      </div>

      {!isStreaming &&
        message.parts?.map((part, index) => {
          if (part.type === "tool-display_valeurs_indicateur") {
            if (part.state !== "output-available") return null;
            return (
              <BaseDisplayTool key={index}>
                <ValeursIndicateurTable indicateurs={part.output.indicateurs} />
              </BaseDisplayTool>
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
              <div key={index} className="animate-fade-in my-2">
                <ChoicesButtons choices={part.output.choices} />
              </div>
            );
          }
          if (part.type === "tool-export_rapport") {
            if (part.state !== "output-available") return null;
            return (
              <div key={index} className="animate-fade-in my-2">
                <ExportRapportDownload contenu={part.output.contenu} />
              </div>
            );
          }
          return null;
        })}
    </div>
  );
};
