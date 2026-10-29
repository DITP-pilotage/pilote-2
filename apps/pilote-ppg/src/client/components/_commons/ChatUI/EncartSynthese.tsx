import { useRef } from "react";
import { toast } from "sonner";
import { AssistantMessageText } from "@/components/_commons/ChatUI/AssistantMessageText";
import { useChatTracking } from "@/components/_commons/ChatUI/ChatContext";
import { copyText } from "@/components/_commons/ChatUI/copyResponse";
import { formaterDateRedaction } from "@/components/_commons/ChatUI/dateRedaction";
import {
  horsImpression,
  imprimerEncart,
  nomEncart,
} from "@/components/_commons/ChatUI/exporterEncart";
import { Icone } from "@/components/_commons/Icone";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";
import { DownloadIcon } from "@/components/_commons/Icones/DownloadIcon";
import { Button } from "@/components/shared/Button";
import type { EncartOutput } from "@/server/albert/tools/encart";

const TYPES: Record<EncartOutput["type"], string> = {
  synthese: "Synthèse territoriale",
  comparaison: "Comparaison territoriale",
};

/**
 * La synthèse ou la comparaison rédigée par le sous-agent (PIL-1900), mise en
 * page comme une note : elle se remplit au fil de la rédaction et déborde de
 * la colonne de discussion sur grand écran. Une fois rédigée, elle se copie
 * en markdown ou se télécharge en PDF : c'est le rapport de la synthèse.
 */
export const EncartSynthese = ({
  output,
  isStreaming,
  llmCallId,
}: {
  output: EncartOutput;
  /** Une rédaction interrompue (arrêt, rechargement) ne reste pas « en cours ». */
  isStreaming: boolean;
  llmCallId?: string;
}) => {
  const track = useChatTracking();
  const encartRef = useRef<HTMLElement>(null);
  if (output.acces_refuse) return null;
  const enCours = isStreaming && !output.termine;
  const enAttenteDuTexte = enCours && output.markdown.trim() === "";

  const suivreExport = ({
    name,
    exporter,
    erreur,
  }: {
    name: "export.report_copy" | "export.report_pdf";
    exporter: () => Promise<void>;
    erreur: string;
  }) => {
    const trackExport = (action: "select" | "success" | "error") =>
      track({ action, name, dimensions: { llm_call_id: llmCallId } });

    trackExport("select");
    return exporter()
      .then(() => trackExport("success"))
      .catch(() => {
        trackExport("error");
        toast.error(erreur);
      });
  };

  const copier = () =>
    suivreExport({
      name: "export.report_copy",
      exporter: () =>
        copyText({ text: output.markdown }).then(() => {
          toast.success("Texte copié dans le presse-papiers", {
            duration: 3000,
          });
        }),
      erreur: "Le texte n'a pas pu être copié",
    });

  const telechargerPdf = () => {
    const encart = encartRef.current;
    if (encart === null) return;
    suivreExport({
      name: "export.report_pdf",
      exporter: () =>
        imprimerEncart({
          encart,
          titre: nomEncart({
            markdown: output.markdown,
            type: output.type,
            dateRedaction: output.date_redaction,
          }),
        }),
      erreur: "Le PDF n'a pas pu être préparé",
    });
  };

  return (
    <article
      className="albert-encart border border-dsfr-grey-925 border-t-[5px] border-t-dsfr-blue-france-sun-113 bg-white px-8 py-8 shadow-md lg:-mx-16 lg:px-16"
      ref={encartRef}
    >
      <header className="mb-5 flex items-start justify-between gap-4 border-b border-dsfr-grey-925 pb-3.5 text-[12.5px] leading-5 text-dsfr-mention-grey">
        <div>
          <p className="mb-0 text-[13px] font-bold uppercase tracking-wide text-dsfr-blue-france-sun-113">
            {TYPES[output.type]}
          </p>
          <p className="mb-0">Jalon {output.jalon}</p>
        </div>
        <div className="text-right">
          <p className="mb-0">
            {formaterDateRedaction({ dateRedaction: output.date_redaction })}
          </p>
          <p className="mb-0">À partir des données publiées dans PILOTE</p>
        </div>
      </header>
      {enAttenteDuTexte && (
        <p className="mb-2 text-sm text-dsfr-mention-grey">
          Rédaction en cours…
        </p>
      )}
      <AssistantMessageText streaming={enCours} text={output.markdown} />
      {output.termine && (
        <footer
          className="mt-6 flex flex-wrap justify-end gap-3 border-t border-dsfr-grey-925 pt-4"
          {...horsImpression()}
        >
          <Button
            iconLeft={
              <Icone className="h-4 w-4 text-current" icone={ClipboardIcon} />
            }
            onClick={copier}
            size="sm"
            title="Copier le texte de l'encart, en markdown, dans le presse-papiers"
            variant="tertiary"
          >
            Copier
          </Button>
          <Button
            iconLeft={
              <Icone className="h-4 w-4 text-current" icone={DownloadIcon} />
            }
            onClick={telechargerPdf}
            size="sm"
            variant="secondary"
          >
            Télécharger en PDF
          </Button>
        </footer>
      )}
    </article>
  );
};
