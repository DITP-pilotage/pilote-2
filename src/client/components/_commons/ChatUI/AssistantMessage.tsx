import { Fragment, memo } from "react";
import { toast } from "sonner";
import { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { ToolCallIndicator } from "@/components/_commons/ChatUI/ToolCallIndicator";
import { AssistantMessageText } from "@/components/_commons/ChatUI/AssistantMessageText";
import { AssistantLoader } from "@/components/_commons/ChatUI/AssistantLoader";
import { BaseDisplayTool } from "@/components/_commons/ChatUI/BaseDisplayTool";
import { ChoicesButtons } from "@/components/_commons/ChatUI/ChoicesButtons";
import { ExportRapportDownload } from "@/components/_commons/ChatUI/ExportRapportDownload";
import { ValeursIndicateurTable } from "@/components/_commons/ChatUI/ValeursIndicateurTable";
import { ValeursIndicateurSkeleton } from "@/components/_commons/ChatUI/ValeursIndicateurSkeleton";
import { extractMessageText } from "@/components/_commons/ChatUI/utils";
import { Icone } from "@/components/_commons/Icone";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";

const TOOLS_HIDING_TEXT = ["export_rapport"];

export const AssistantMessage = memo(function AssistantMessage({
  message,
  isStreaming,
}: {
  message: PiloteUIMessage;
  isStreaming: boolean;
}) {
  const shouldHideText = message.parts?.some((part) =>
    TOOLS_HIDING_TEXT.some(
      (toolName) =>
        part.type === `tool-${toolName}` &&
        "state" in part &&
        part.state === "output-available",
    ),
  );

  const hasText = message.parts?.some(
    (part) => part.type === "text" && part.text.trim().length > 0,
  );

  const lastTextIndex =
    message.parts?.reduce<number>(
      (acc, part, index) => (part.type === "text" ? index : acc),
      -1,
    ) ?? -1;

  const lastPart = message.parts?.[message.parts.length - 1];
  const isTextStreaming = lastPart?.type === "text";
  const hasToolCallPending = message.parts?.some(
    (part) =>
      "state" in part &&
      part.state !== "output-available" &&
      part.state !== "output-error",
  );
  const showLoader = isStreaming && !isTextStreaming && !hasToolCallPending;

  return (
    <div className="text-sm text-gray-900 w-full">
      <div className="max-w-3xl mx-auto">
        {message.parts?.map((part, index) => {
          if (
            part.type === "tool-get_taux_avancement_territoire" ||
            part.type === "tool-get_chantiers_en_retard" ||
            part.type === "tool-get_chantiers_en_difficulte"
          ) {
            return <ToolCallIndicator key={index} part={part} />;
          }
          if (part.type === "tool-get_valeurs_indicateur") {
            return (
              <Fragment key={index}>
                <ToolCallIndicator part={part} />
                {part.state === "output-available" ? (
                  <BaseDisplayTool>
                    <ValeursIndicateurTable
                      indicateurs={part.output.resultats.indicateurs}
                    />
                  </BaseDisplayTool>
                ) : part.state !== "output-error" ? (
                  <BaseDisplayTool>
                    <ValeursIndicateurSkeleton />
                  </BaseDisplayTool>
                ) : null}
              </Fragment>
            );
          }
          return null;
        })}
      </div>

      {message.parts?.map((part, index) => {
        if (part.type === "text") {
          if (shouldHideText) return null;
          return (
            <div key={index} className="max-w-3xl mx-auto relative group/text">
              <AssistantMessageText text={part.text} />
              {!isStreaming && index === lastTextIndex && hasText && (
                <button
                  className="absolute top-1 right-1 p-1 rounded bg-white/80 text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 opacity-0 group-hover/text:opacity-100 transition-opacity"
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
          );
        }

        if (part.type === "tool-display_choices") {
          if (isStreaming || part.state !== "output-available") return null;
          return (
            <div key={index} className="animate-fade-in my-2">
              <ChoicesButtons choices={part.output.choices} />
            </div>
          );
        }

        if (part.type === "tool-export_rapport") {
          if (part.state === "output-error") return null;
          return (
            <div key={index} className="my-2">
              <ExportRapportDownload part={part} isStreaming={isStreaming} />
            </div>
          );
        }

        return null;
      })}

      {showLoader && (
        <div className="max-w-3xl mx-auto">
          <AssistantLoader label="Réflexion en cours" />
        </div>
      )}
    </div>
  );
});
