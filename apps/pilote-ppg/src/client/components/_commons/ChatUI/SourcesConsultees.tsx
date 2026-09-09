import { memo, useState } from "react";
import type { ToolUIPart } from "ai";
import { CheckLineIcon } from "@/components/_commons/Icones/CheckLineIcon";
import { ErrorWarningIcon } from "@/components/_commons/Icones/ErrorWarningIcon";
import { LoaderIcon } from "@/components/_commons/Icones/LoaderIcon";
import type {
  PiloteUIMessage,
  PiloteUITools,
} from "@/server/albert/PiloteUIMessage";
import { clsxm } from "@/utils/clsxm";

export type SourceToolPart = Extract<
  ToolUIPart<PiloteUITools>,
  {
    type:
      | "tool-get_taux_avancement_territoire"
      | "tool-get_chantiers"
      | "tool-get_chantiers_signales"
      | "tool-get_indicateurs"
      | "tool-get_chantier_commentaires"
      | "tool-get_chantier_objectifs"
      | "tool-search_chantiers"
      | "tool-search_indicateurs"
      | "tool-search_territoires";
  }
>;

const LIBELLES: Record<SourceToolPart["type"], string> = {
  "tool-get_taux_avancement_territoire": "Taux d'avancement",
  "tool-get_chantiers": "Chantiers",
  "tool-get_chantiers_signales": "Chantiers signalés",
  "tool-get_indicateurs": "Indicateurs",
  "tool-get_chantier_commentaires": "Commentaires",
  "tool-get_chantier_objectifs": "Objectifs",
  "tool-search_chantiers": "Recherche de chantiers",
  "tool-search_indicateurs": "Recherche d'indicateurs",
  "tool-search_territoires": "Recherche de territoires",
};

const TYPES_SOURCES = new Set<string>(Object.keys(LIBELLES));

export const estSourcePart = (
  part: NonNullable<PiloteUIMessage["parts"]>[number],
): part is SourceToolPart => TYPES_SOURCES.has(part.type);

const estTerminee = (part: SourceToolPart) =>
  part.state === "output-available" || part.state === "output-error";

const IconeEtat = ({ part }: { part: SourceToolPart }) => {
  if (part.state === "output-error") {
    return <ErrorWarningIcon className="h-3.5 w-3.5 text-error" />;
  }
  if (part.state === "output-available") {
    return <CheckLineIcon className="h-3.5 w-3.5 text-success" />;
  }
  return <LoaderIcon className="h-3.5 w-3.5 animate-spin text-primary" />;
};

const formaterValeur = (valeur: unknown): string =>
  typeof valeur === "string" || typeof valeur === "number"
    ? String(valeur)
    : JSON.stringify(valeur);

const DetailSource = ({ part }: { part: SourceToolPart }) => {
  const parametres = Object.entries(
    (part.input as Record<string, unknown> | undefined) ?? {},
  );
  const sortie = estTerminee(part)
    ? ((part as { output?: unknown; errorText?: string }).output ??
      (part as { errorText?: string }).errorText)
    : undefined;

  return (
    <div className="border border-dsfr-grey-925 text-xs leading-[18px] text-dsfr-grey-50">
      <div className="flex items-center gap-2 border-b border-dsfr-grey-925 bg-dsfr-grey-1000 px-3 py-2 font-bold text-dsfr-grey-200">
        <IconeEtat part={part} />
        {LIBELLES[part.type]}
      </div>
      {parametres.length > 0 && (
        <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-1 px-3 py-2.5">
          {parametres.map(([cle, valeur]) => (
            <div className="contents" key={cle}>
              <dt className="text-dsfr-mention-grey">
                {cle.replaceAll("_", " ")}
              </dt>
              <dd className="m-0 break-words">{formaterValeur(valeur)}</dd>
            </div>
          ))}
        </dl>
      )}
      {sortie !== undefined && (
        <details className="border-t border-dsfr-grey-925 px-3 py-2">
          <summary className="cursor-pointer font-medium text-primary">
            Voir la réponse brute
          </summary>
          <pre className="mt-2 max-h-60 overflow-auto bg-dsfr-grey-1000 p-2 text-[11px] leading-4 text-dsfr-grey-200">
            {typeof sortie === "string"
              ? sortie
              : JSON.stringify(sortie, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

const SourceChip = ({
  part,
  ouverte,
  onToggle,
}: {
  part: SourceToolPart;
  ouverte: boolean;
  onToggle: () => void;
}) => (
  <button
    aria-expanded={ouverte}
    className={clsxm(
      "inline-flex h-[26px] items-center gap-1.5 border bg-dsfr-grey-1000 px-2 text-xs font-medium text-dsfr-grey-200 transition-colors",
      "hover:border-dsfr-grey-625",
      part.state === "output-error"
        ? "border-[#F5B5B5] bg-dsfr-warning-950"
        : "border-dsfr-grey-925",
      ouverte && "border-primary text-primary",
    )}
    onClick={onToggle}
    type="button"
  >
    <IconeEtat part={part} />
    {LIBELLES[part.type]}
  </button>
);

export const SourcesConsultees = memo(function SourcesConsultees({
  parts,
}: {
  parts: SourceToolPart[];
}) {
  const [ouverte, setOuverte] = useState<string | null>(null);
  const toutesTerminees = parts.every(estTerminee);
  const partOuverte = parts.find((part) => part.toolCallId === ouverte);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-[13px] leading-5 text-dsfr-mention-grey">
        {toutesTerminees && (
          <span>
            {parts.length}{" "}
            {parts.length > 1 ? "sources consultées" : "source consultée"}
          </span>
        )}
        {parts.map((part) => (
          <SourceChip
            key={part.toolCallId}
            onToggle={() =>
              setOuverte((courante) =>
                courante === part.toolCallId ? null : part.toolCallId,
              )
            }
            ouverte={part.toolCallId === ouverte}
            part={part}
          />
        ))}
      </div>
      {partOuverte && <DetailSource part={partOuverte} />}
    </div>
  );
});
