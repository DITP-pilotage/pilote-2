import { AssistantMessageText } from "@/components/_commons/ChatUI/AssistantMessageText";
import { useChatTracking } from "@/components/_commons/ChatUI/ChatContext";
import {
  nomFichierEncart,
  telechargerEncart,
} from "@/components/_commons/ChatUI/telechargerEncart";
import { Icone } from "@/components/_commons/Icone";
import { DownloadIcon } from "@/components/_commons/Icones/DownloadIcon";
import { Button } from "@/components/shared/Button";
import type { EncartOutput } from "@/server/albert/tools/encart";

const TYPES: Record<EncartOutput["type"], string> = {
  synthese: "Synthèse territoriale",
  comparaison: "Comparaison territoriale",
};

const formaterDate = (dateRedaction: string): string =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateRedaction}T00:00:00Z`));

/**
 * La synthèse ou la comparaison rédigée par le sous-agent (PIL-1900), mise en
 * page comme une note : elle se remplit au fil de la rédaction et déborde de
 * la colonne de discussion sur grand écran. Une fois rédigée, elle se
 * télécharge en markdown : c'est le rapport de la synthèse.
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
  if (output.acces_refuse) return null;
  const enCours = isStreaming && !output.termine;

  const telecharger = () => {
    track({
      action: "select",
      name: "export.report_markdown",
      dimensions: { llm_call_id: llmCallId },
    });
    telechargerEncart({
      markdown: output.markdown,
      nomFichier: nomFichierEncart({
        markdown: output.markdown,
        type: output.type,
        dateRedaction: output.date_redaction,
      }),
    });
  };

  return (
    <article className="albert-encart border border-dsfr-grey-925 border-t-[5px] border-t-dsfr-blue-france-sun-113 bg-white px-8 py-8 shadow-md lg:-mx-16 lg:px-16">
      <header className="mb-5 flex items-start justify-between gap-4 border-b border-dsfr-grey-925 pb-3.5 text-[12.5px] leading-5 text-dsfr-mention-grey">
        <div>
          <p className="mb-0 text-[13px] font-bold uppercase tracking-wide text-dsfr-blue-france-sun-113">
            {TYPES[output.type]}
          </p>
          <p className="mb-0">Jalon {output.jalon}</p>
        </div>
        <div className="text-right">
          <p className="mb-0">{formaterDate(output.date_redaction)}</p>
          <p className="mb-0">À partir des données publiées dans PILOTE</p>
        </div>
      </header>
      {enCours && (
        <p className="mb-2 text-sm text-dsfr-mention-grey">
          Rédaction en cours…
        </p>
      )}
      <AssistantMessageText streaming={enCours} text={output.markdown} />
      {output.termine && (
        <footer className="mt-6 flex justify-end border-t border-dsfr-grey-925 pt-4">
          <Button
            iconLeft={
              <Icone className="h-4 w-4 text-current" icone={DownloadIcon} />
            }
            onClick={telecharger}
            size="sm"
            variant="secondary"
          >
            Télécharger
          </Button>
        </footer>
      )}
    </article>
  );
};
