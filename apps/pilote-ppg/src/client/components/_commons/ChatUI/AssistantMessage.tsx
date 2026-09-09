import { memo } from "react";
import { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { ToolCallIndicator } from "@/components/_commons/ChatUI/ToolCallIndicator";
import { AssistantMessageText } from "@/components/_commons/ChatUI/AssistantMessageText";
import { AssistantLoader } from "@/components/_commons/ChatUI/AssistantLoader";
import { ExportRapportDownload } from "@/components/_commons/ChatUI/ExportRapportDownload";
import { DashboardRender } from "@/components/_commons/ChatUI/DashboardRender";
import { DashboardLoader } from "@/components/_commons/ChatUI/DashboardWidgets/DashboardLoader";
import { extractMessageText } from "@/components/_commons/ChatUI/utils";
import { LastResponseActions } from "@/components/_commons/ChatUI/LastResponseActions";

const TOOLS_HIDING_TEXT = new Set(["export_rapport"]);

export const AssistantMessage = memo(function AssistantMessage({
  message,
  isStreaming,
  isLastAssistantMessage,
  conversationId,
}: {
  message: PiloteUIMessage;
  isStreaming: boolean;
  isLastAssistantMessage: boolean;
  conversationId: string;
}) {
  const shouldHideText = message.parts?.some((part) => {
    const toolName = part.type.startsWith("tool-") ? part.type.slice(5) : null;
    return (
      toolName !== null &&
      TOOLS_HIDING_TEXT.has(toolName) &&
      "state" in part &&
      part.state === "output-available"
    );
  });

  const hasText = message.parts?.some(
    (part) => part.type === "text" && part.text.trim().length > 0,
  );

  const lastPart = message.parts?.[message.parts.length - 1];
  const isTextStreaming = lastPart?.type === "text";
  const hasStreamingText = isTextStreaming && lastPart.text !== "";
  const showLoader = isStreaming && isTextStreaming && !hasStreamingText;

  return (
    <div className="text-sm text-gray-900 w-full relative group/message">
      {isLastAssistantMessage && hasText && !isStreaming && (
        <LastResponseActions
          texte={extractMessageText(message)}
          conversationId={conversationId}
          messageId={message.id}
        />
      )}

      <div className="max-w-3xl mx-auto">
        {message.parts?.map((part, index) => {
          if (
            part.type === "tool-get_taux_avancement_territoire" ||
            part.type === "tool-get_chantiers" ||
            part.type === "tool-get_indicateurs" ||
            part.type === "tool-get_chantier_commentaires" ||
            part.type === "tool-get_chantier_objectifs" ||
            part.type === "tool-search_chantiers" ||
            part.type === "tool-search_indicateurs" ||
            part.type === "tool-search_territoires"
          ) {
            return <ToolCallIndicator key={index} part={part} />;
          }
          return null;
        })}
      </div>

      {message.parts?.map((part, index) => {
        if (part.type === "text") {
          if (shouldHideText) return null;
          return (
            <div key={index} className="max-w-3xl mx-auto">
              <AssistantMessageText text={part.text} />
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

        if (part.type === "tool-create_dashboard") {
          if (part.state === "output-error") return null;
          if (part.state === "output-available") {
            return (
              <div key={index} className="max-w-6xl mx-auto">
                <DashboardRender output={part.output} />
              </div>
            );
          }
          return (
            <div key={index} className="max-w-6xl mx-auto">
              <DashboardLoader />
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
