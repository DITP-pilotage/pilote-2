import type { ToolUIPart } from "ai";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { DownloadIcon } from "@/components/_commons/Icones/DownloadIcon";
import type { PiloteUITools } from "@/server/albert/PiloteUIMessage";
import { clsxm } from "@/utils/clsxm";

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
  const format =
    part.state === "output-available"
      ? part.output.format
      : (part.input as { format?: string } | undefined)?.format;
  const etiquette = format === "markdown" ? "MD" : "PDF";
  const libelle = format === "markdown" ? "Rapport Markdown" : "Rapport PDF";

  const handleDownload = () => {
    if (!isReady) return;
    const anchor = document.createElement("a");
    anchor.href = part.output.url;
    anchor.download = "";
    anchor.click();
  };

  return (
    <div
      className={clsxm(
        "flex items-center gap-3 border border-dsfr-grey-900 bg-white p-3",
        !isReady && "border-dashed",
      )}
    >
      <span
        className={clsxm(
          "flex h-10 w-10 shrink-0 items-center justify-center text-[10px] font-bold tracking-wide",
          isReady
            ? "bg-dsfr-warning-950 text-error"
            : "bg-dsfr-contrast-grey text-dsfr-mention-grey",
        )}
      >
        {etiquette}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {isReady ? (
          <>
            <span className="text-sm font-bold leading-5 text-dsfr-grey-50">
              {libelle}
            </span>
            <span className="text-xs leading-4 text-dsfr-mention-grey">
              Prêt à télécharger
            </span>
          </>
        ) : (
          <>
            <span className="text-sm font-medium leading-5 text-dsfr-mention-grey">
              Génération du rapport…
            </span>
            <div
              aria-hidden="true"
              className="relative h-1 overflow-hidden bg-pilote-jauge-fond"
            >
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-primary to-transparent" />
            </div>
          </>
        )}
      </div>
      {isReady && (
        <Bouton
          iconLeft={
            <Icone className="h-4 w-4 !text-current" icone={DownloadIcon} />
          }
          label="Télécharger"
          onClick={handleDownload}
          size="sm"
          variant="secondary"
        />
      )}
    </div>
  );
};
