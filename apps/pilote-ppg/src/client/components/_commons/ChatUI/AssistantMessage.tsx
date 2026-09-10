import { memo, type ReactNode } from "react";
import { toast } from "sonner";
import { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { ActionReponse } from "@/components/_commons/ChatUI/ActionReponse";
import { AssistantMessageText } from "@/components/_commons/ChatUI/AssistantMessageText";
import { ChoicesInline } from "@/components/_commons/ChatUI/ChoicesInline";
import { DashboardRender } from "@/components/_commons/ChatUI/DashboardRender";
import { DashboardLoader } from "@/components/_commons/ChatUI/DashboardWidgets/DashboardLoader";
import type { EtatAssistant } from "@/components/_commons/ChatUI/deriverEtatAssistant";
import { ExportRapportDownload } from "@/components/_commons/ChatUI/ExportRapportDownload";
import { SignatureAssistant } from "@/components/_commons/ChatUI/SignatureAssistant";
import {
  estSourcePart,
  SourcesConsultees,
} from "@/components/_commons/ChatUI/SourcesConsultees";
import { SqueletteTexte } from "@/components/_commons/ChatUI/Squelette";
import { extractMessageText } from "@/components/_commons/ChatUI/utils";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";

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
  /** Ce qu'Albert est en train de faire, affiché sous sa signature. */
  etat?: EtatAssistant | null;
  /** Rend la question à choix (display_choices) dans le fil. */
  afficherChoix?: boolean;
  /** Boutons d'évaluation à afficher à côté de « Copier ». */
  evaluation?: ReactNode;
}) {
  const parts = message.parts ?? [];
  const sources = parts.filter(estSourcePart);

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

  const lastTextIndex = parts.reduce<number>(
    (acc, part, index) => (part.type === "text" ? index : acc),
    -1,
  );

  const afficherSquelette = isStreaming && !hasText && sources.length > 0;

  const copier = () => {
    navigator.clipboard.writeText(extractMessageText(message)).then(() => {
      toast.success("Texte copié dans le presse-papiers", { duration: 3000 });
    });
  };

  return (
    <div className="flex w-full flex-col gap-3 text-[15px] leading-6 text-dsfr-grey-50">
      <SignatureAssistant etat={etat} />

      {sources.length > 0 && <SourcesConsultees parts={sources} />}

      {afficherSquelette && <SqueletteTexte />}

      {parts.map((part, index) => {
        if (part.type === "text") {
          if (shouldHideText || part.text.length === 0) return null;
          return (
            <AssistantMessageText
              key={index}
              streaming={isStreaming && index === lastTextIndex}
              text={part.text}
            />
          );
        }

        if (part.type === "tool-export_rapport") {
          if (part.state === "output-error") return null;
          return (
            <ExportRapportDownload
              isStreaming={isStreaming}
              key={index}
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

        if (
          part.type === "tool-display_choices" &&
          afficherChoix &&
          part.state === "output-available"
        ) {
          return (
            <ChoicesInline
              choices={part.output.choices}
              key={index}
              question={part.output.question}
            />
          );
        }

        return null;
      })}

      {!isStreaming && (hasText || evaluation) && (
        <div className="flex flex-wrap items-center gap-1">
          {hasText && (
            <ActionReponse
              icone={ClipboardIcon}
              label="Copier"
              onClick={copier}
              title="Copier dans le presse-papiers"
            />
          )}
          {evaluation}
        </div>
      )}
    </div>
  );
});
