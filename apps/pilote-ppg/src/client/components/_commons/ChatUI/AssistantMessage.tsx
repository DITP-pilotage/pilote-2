import { memo, useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { AssistantMessageText } from "@/components/_commons/ChatUI/AssistantMessageText";
import { ChoicesInline } from "@/components/_commons/ChatUI/ChoicesInline";
import {
  CentreAideEncart,
  derniereConsultationCentreAide,
} from "@/components/_commons/ChatUI/CentreAideEncart";
import {
  copyResponse,
  markCopyableBlock,
} from "@/components/_commons/ChatUI/copyResponse";
import { DashboardRender } from "@/components/_commons/ChatUI/DashboardRender";
import { DashboardLoader } from "@/components/_commons/ChatUI/DashboardWidgets/DashboardLoader";
import type { EtatAssistant } from "@/components/_commons/ChatUI/deriverEtatAssistant";
import { ExportRapportDownload } from "@/components/_commons/ChatUI/ExportRapportDownload";
import { SignatureAssistant } from "@/components/_commons/ChatUI/SignatureAssistant";
import {
  estSourcePart,
  SourcesConsultees,
} from "@/components/_commons/ChatUI/SourcesConsultees";
import { SkeletonText } from "@/components/shared/Skeleton";
import { extractMessageText } from "@/components/_commons/ChatUI/utils";
import { BoutonCopier } from "@/components/_commons/BoutonCopier/BoutonCopier";
import {
  copyExportName,
  llmCallIdOf,
} from "@/components/_commons/ChatUI/assistantEvents";
import { useChatTracking } from "@/components/_commons/ChatUI/ChatContext";

const TOOLS_HIDING_TEXT = new Set(["export_rapport"]);

export const AssistantMessage = memo(function AssistantMessage({
  message,
  isStreaming,
  etat = null,
  afficherChoix = false,
  evaluation,
}: {
  message: PiloteUIMessage;
  isStreaming: boolean;
  /** Ce que l'assistant est en train de faire, affiché sous sa signature. */
  etat?: EtatAssistant | null;
  /** Rend la question à choix (clarify_with_choices) dans le fil. */
  afficherChoix?: boolean;
  /** Boutons d'évaluation à afficher à côté de « Copier ». */
  evaluation?: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const parts = message.parts ?? [];
  const sources = parts.filter(estSourcePart);
  const consultationCentreAide = derniereConsultationCentreAide(parts);

  const shouldHideText = parts.some((part) => {
    const toolName = part.type.startsWith("tool-") ? part.type.slice(5) : null;
    return (
      toolName !== null &&
      TOOLS_HIDING_TEXT.has(toolName) &&
      "state" in part &&
      part.state === "output-available"
    );
  });

  const hasText = parts.some(
    (part) => part.type === "text" && part.text.trim().length > 0,
  );

  const copyExport = copyExportName(message);
  const canCopy = copyExport !== null;
  const track = useChatTracking();

  const lastTextIndex = parts.reduce<number>(
    (acc, part, index) => (part.type === "text" ? index : acc),
    -1,
  );

  const showSkeleton = isStreaming && !hasText && sources.length > 0;

  const copier = () => {
    const root = rootRef.current;
    if (root == null || copyExport === null) return;

    const trackCopy = (action: "select" | "success" | "error") =>
      track({
        action,
        name: copyExport,
        dimensions: { llm_call_id: llmCallIdOf(message) },
      });

    trackCopy("select");
    copyResponse({ root, text: extractMessageText(message) })
      .then(() => {
        trackCopy("success");
        toast.success("Réponse copiée dans le presse-papiers", {
          duration: 3000,
        });
      })
      .catch(() => {
        trackCopy("error");
        toast.error("La réponse n'a pas pu être copiée");
      });
  };

  return (
    <div
      className="flex w-full flex-col gap-3 text-[15px] leading-6 text-dsfr-grey-50"
      ref={rootRef}
    >
      <SignatureAssistant etat={etat} />

      {sources.length > 0 && <SourcesConsultees parts={sources} />}

      {showSkeleton && <SkeletonText />}

      {parts.map((part, index) => {
        if (part.type === "text") {
          if (shouldHideText || part.text.length === 0) return null;
          return (
            <div key={index} {...markCopyableBlock("text")}>
              <AssistantMessageText
                streaming={isStreaming && index === lastTextIndex}
                text={part.text}
              />
            </div>
          );
        }

        if (part.type === "tool-export_rapport") {
          if (part.state === "output-error") return null;
          return (
            <ExportRapportDownload
              isStreaming={isStreaming}
              key={index}
              llmCallId={llmCallIdOf(message)}
              part={part}
            />
          );
        }

        if (part.type === "tool-create_dashboard") {
          if (part.state === "output-error") return null;
          if (part.state === "output-available") {
            return <DashboardRender key={index} output={part.output} />;
          }
          return <DashboardLoader key={index} />;
        }

        return null;
      })}

      {/* Sous le texte, qui suit l'appel de l'outil dans les parts. */}
      {consultationCentreAide && (
        <CentreAideEncart output={consultationCentreAide} />
      )}

      {/* Les choix ferment la réponse, même si le modèle a écrit du texte après l'appel. */}
      {afficherChoix &&
        parts.map((part, index) =>
          part.type === "tool-clarify_with_choices" &&
          part.state === "output-available" ? (
            <ChoicesInline
              choices={part.output.choices}
              key={index}
              llmCallId={llmCallIdOf(message)}
              question={part.output.question}
            />
          ) : null,
        )}

      {!isStreaming && (canCopy || evaluation) && (
        <div className="flex flex-wrap items-center gap-1">
          {canCopy && (
            <BoutonCopier
              className="h-7 px-2 text-xs font-medium"
              libelle="Copier la réponse dans le presse-papiers"
              onClick={copier}
              texte="Copier"
            />
          )}
          {evaluation}
        </div>
      )}
    </div>
  );
});
