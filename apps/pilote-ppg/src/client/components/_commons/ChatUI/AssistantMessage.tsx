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
  copyDashboardImage,
  copyText,
} from "@/components/_commons/ChatUI/copyResponse";
import { DashboardRender } from "@/components/_commons/ChatUI/DashboardRender";
import { DashboardLoader } from "@/components/_commons/ChatUI/DashboardWidgets/DashboardLoader";
import type { EtatAssistant } from "@/components/_commons/ChatUI/deriverEtatAssistant";
import { SignatureAssistant } from "@/components/_commons/ChatUI/SignatureAssistant";
import {
  estSourcePart,
  SourcesConsultees,
} from "@/components/_commons/ChatUI/SourcesConsultees";
import { texteCopieCentreAide } from "@/components/_commons/ChatUI/texteCopieCentreAide";
import { SkeletonText } from "@/components/shared/Skeleton";
import { extractMessageText } from "@/components/_commons/ChatUI/utils";
import { EncartSynthese } from "@/components/_commons/ChatUI/EncartSynthese";
import { texteEncarts } from "@/components/_commons/ChatUI/texteEncarts";
import type { EncartOutput } from "@/server/albert/tools/encart";
import { BoutonCopier } from "@/components/_commons/BoutonCopier/BoutonCopier";
import {
  copyExportNames,
  llmCallIdOf,
} from "@/components/_commons/ChatUI/assistantEvents";
import { useChatTracking } from "@/components/_commons/ChatUI/ChatContext";

// Avant le premier résultat de l'outil : l'en-tête de l'encart, sans texte.
const encartEnAttente = ({
  type,
  input,
}: {
  type: string;
  input: { jalon?: number } | undefined;
}): EncartOutput => ({
  type:
    type === "tool-rediger_comparaison_territoires"
      ? "comparaison"
      : "synthese",
  jalon: input?.jalon ?? new Date().getFullYear(),
  date_redaction: new Date().toISOString().slice(0, 10),
  markdown: "",
  termine: false,
});

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
  /** Boutons d'évaluation à afficher à côté des boutons de copie. */
  evaluation?: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const parts = message.parts ?? [];
  const sources = parts.filter(estSourcePart);
  const consultationCentreAide = derniereConsultationCentreAide(parts);

  const hasText = parts.some(
    (part) => part.type === "text" && part.text.trim().length > 0,
  );

  const copyExports = copyExportNames(message);
  const canCopyText = copyExports.includes("export.text");
  const canCopyImage = copyExports.includes("export.dashboard_image");
  const track = useChatTracking();

  const lastTextIndex = parts.reduce<number>(
    (acc, part, index) => (part.type === "text" ? index : acc),
    -1,
  );

  const showSkeleton = isStreaming && !hasText && sources.length > 0;

  const trackedCopy = ({
    name,
    copy,
    success,
    error,
  }: {
    name: (typeof copyExports)[number];
    copy: () => Promise<void>;
    success: string;
    error: string;
  }) => {
    const trackCopy = (action: "select" | "success" | "error") =>
      track({
        action,
        name,
        dimensions: { llm_call_id: llmCallIdOf(message) },
      });

    trackCopy("select");
    copy()
      .then(() => {
        trackCopy("success");
        toast.success(success, { duration: 3000 });
      })
      .catch(() => {
        trackCopy("error");
        toast.error(error);
      });
  };

  const copierTexte = () => {
    const texte = [
      ...texteEncarts({ message }),
      extractMessageText(message),
      ...(consultationCentreAide
        ? [
            texteCopieCentreAide({
              output: consultationCentreAide,
              origine: window.location.origin,
            }),
          ]
        : []),
    ].join("\n\n");

    trackedCopy({
      name: "export.text",
      copy: () => copyText({ text: texte }),
      success: "Texte copié dans le presse-papiers",
      error: "Le texte n'a pas pu être copié",
    });
  };

  const copierImage = () => {
    const root = rootRef.current;
    if (root == null) return;

    trackedCopy({
      name: "export.dashboard_image",
      copy: () => copyDashboardImage({ root }),
      success: "Image copiée dans le presse-papiers",
      error: "L'image n'a pas pu être copiée",
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
          if (part.text.length === 0) return null;
          return (
            <AssistantMessageText
              key={index}
              streaming={isStreaming && index === lastTextIndex}
              text={part.text}
            />
          );
        }

        if (
          part.type === "tool-rediger_synthese_territoire" ||
          part.type === "tool-rediger_comparaison_territoires"
        ) {
          if (part.state === "output-error") return null;
          return (
            <EncartSynthese
              isStreaming={isStreaming}
              key={index}
              llmCallId={llmCallIdOf(message)}
              output={
                part.state === "output-available"
                  ? part.output
                  : encartEnAttente({ type: part.type, input: part.input })
              }
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

      {/* Sous le texte, qui suit l'appel de l'outil dans les parts, et une
          fois ce texte rédigé : l'encart ferme la réponse. */}
      {!isStreaming && consultationCentreAide && (
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

      {!isStreaming && (canCopyText || canCopyImage || evaluation) && (
        <div className="flex flex-wrap items-center gap-1">
          {canCopyText && (
            <BoutonCopier
              className="h-7 px-2 text-xs font-medium"
              libelle="Copier le texte de la réponse dans le presse-papiers"
              onClick={copierTexte}
              texte="Copier le texte"
            />
          )}
          {canCopyImage && (
            <BoutonCopier
              className="h-7 px-2 text-xs font-medium"
              libelle="Copier l'image du tableau de bord dans le presse-papiers"
              onClick={copierImage}
              texte="Copier l'image"
            />
          )}
          {evaluation}
        </div>
      )}
    </div>
  );
});
