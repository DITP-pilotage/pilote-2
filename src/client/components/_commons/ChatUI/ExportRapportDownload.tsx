import type { ToolUIPart } from "ai";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { LoaderIcon } from "@/components/_commons/Icones/LoaderIcon";
import type { PiloteUITools } from "@/server/albert/PiloteUIMessage";

type ExportRapportPart = Extract<
  ToolUIPart<PiloteUITools>,
  { type: "tool-export_rapport" }
>;

export const ExportRapportDownload = ({
  part,
  isStreaming,
}: {
  part: ExportRapportPart;
  isStreaming: boolean;
}) => {
  const isReady = part.state === "output-available" && !isStreaming;

  const handleDownload = () => {
    if (!isReady) return;
    const anchor = document.createElement("a");
    anchor.href = part.output.url;
    anchor.download = "";
    anchor.click();
  };

  const label = isReady
    ? part.output.format === "pdf"
      ? "Télécharger le rapport PDF"
      : "Télécharger le rapport Markdown"
    : "Génération en cours...";

  return (
    <div className="my-2 max-w-3xl mx-auto flex justify-center">
      <Bouton
        label={label}
        iconLeft={
          !isReady ? <LoaderIcon className="w-4 h-4 animate-spin" /> : undefined
        }
        variant="primary"
        disabled={!isReady}
        onClick={handleDownload}
        type="button"
      />
    </div>
  );
};
