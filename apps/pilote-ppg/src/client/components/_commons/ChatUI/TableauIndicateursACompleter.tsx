import { useId } from "react";
import { telechargerCsv } from "@/client/utils/csv";
import { horodatage } from "@/client/utils/date/date";
import { pluriel } from "@/client/utils/strings";
import { csvIndicateursACompleter } from "@/components/_commons/ChatUI/csvIndicateursACompleter";
import { libelleGroupe } from "@/components/_commons/ChatUI/detailIndicateursACompleter";
import { LigneGroupeIndicateursACompleter } from "@/components/_commons/ChatUI/LigneGroupeIndicateursACompleter";
import {
  type Regroupement,
  useTableauIndicateursACompleter,
} from "@/components/_commons/ChatUI/useTableauIndicateursACompleter";
import { Icone } from "@/components/_commons/Icone";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";
import { DownloadIcon } from "@/components/_commons/Icones/DownloadIcon";
import { Button } from "@/components/shared/Button";
import { COMPACT_CONTROL_CLASSNAME } from "@/components/shared/DataTable/Filters";
import { LIBELLES_MOTIF } from "@/server/albert/tools/indicateursACompleter";
import type { DetailIndicateursACompleter } from "@/server/albert/tools/sortieIndicateursACompleter";
import { clsxm } from "@/utils/clsxm";

const CELLULE = "px-2 py-1.5 md:px-2 md:py-1.5 align-top text-[13px]/5";
// Les lignes de détail s'alignent sur le libellé du dernier niveau de groupe.
const RETRAIT_DETAIL_PAR_NIVEAUX = [
  "",
  "[&>td:first-child]:pl-8",
  "[&>td:first-child]:pl-[3.25rem]",
];
const RETRAIT_EN_TETE_PAR_NIVEAUX = [
  "",
  "[&_th:first-child]:pl-8",
  "[&_th:first-child]:pl-[3.25rem]",
];

const SelecteurRegroupement = ({
  regroupement,
  regroupements,
  onChange,
}: {
  regroupement: Regroupement;
  regroupements: readonly { value: Regroupement; label: string }[];
  onChange: (regroupement: Regroupement) => void;
}) => {
  const id = useId();
  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="whitespace-nowrap text-dsfr-grey-200" htmlFor={id}>
        Regrouper par
      </label>
      <div className="relative">
        <select
          className={clsxm(
            COMPACT_CONTROL_CLASSNAME,
            "appearance-none pl-3 pr-8 font-medium cursor-pointer",
          )}
          id={id}
          onChange={(event) => onChange(event.target.value as Regroupement)}
          value={regroupement}
        >
          {regroupements.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icone
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-current"
          icone={ArrowSLine2Icon}
        />
      </div>
    </div>
  );
};

/**
 * Le détail ligne à ligne, au-delà de ce que le modèle relit : replié sous la
 * synthèse, filtrable, regroupable, exportable en CSV.
 */
export const TableauIndicateursACompleter = ({
  detail,
}: {
  detail: DetailIndicateursACompleter;
}) => {
  const {
    table,
    regroupement,
    regroupements,
    setRegroupement,
    niveauxRegroupement,
    avecChantierDansGroupe,
  } = useTableauIndicateursACompleter(detail);
  const lignesFiltrees = table
    .getFilteredRowModel()
    .rows.map((row) => row.original);
  const nombreChantiers = new Set(
    lignesFiltrees.map((ligne) => ligne.chantier_id),
  ).size;

  const libellesMotifs = detail.motifs
    .map((motif) =>
      motif === "vc" && detail.jalon !== undefined
        ? `${LIBELLES_MOTIF[motif]} (jalon ${detail.jalon})`
        : LIBELLES_MOTIF[motif],
    )
    .join(", ");

  return (
    // Déborde de la colonne de texte comme l'encart de synthèse, quand le fil est assez large.
    <div className="border border-dsfr-grey-925 bg-white @5xl:-mx-16">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <p className="mb-0 text-sm font-bold text-dsfr-grey-50">
          Détail par territoire · {detail.perimetre} · {libellesMotifs} ·{" "}
          {pluriel(lignesFiltrees.length, "ligne", "lignes")} ·{" "}
          {pluriel(nombreChantiers, "chantier", "chantiers")}
        </p>
        <Button
          iconLeft={
            <Icone className="h-4 w-4 text-current" icone={DownloadIcon} />
          }
          onClick={() => {
            telechargerCsv(
              csvIndicateursACompleter({
                lignes: lignesFiltrees,
                motifs: detail.motifs,
              }),
              `indicateurs-a-completer-${horodatage()}`,
            );
          }}
          size="sm"
          variant="secondary"
        >
          Exporter
        </Button>
      </div>
      <details>
        <summary className="cursor-pointer border-t border-dsfr-grey-925 px-4 py-2 text-sm text-dsfr-grey-50">
          Afficher le détail
        </summary>
        <table.Filters
          className="border-t border-dsfr-grey-925"
          layout="compact"
          searchPlaceholder="Rechercher un territoire, un indicateur…"
        >
          <SelecteurRegroupement
            onChange={setRegroupement}
            regroupement={regroupement}
            regroupements={regroupements}
          />
        </table.Filters>
        <table.Root
          caption="Détail des indicateurs à compléter"
          captionHidden
          className="table-fixed"
          containerClassName="max-h-[28rem] overflow-y-auto"
          empty={{ title: "Aucune ligne ne correspond à ces filtres." }}
        >
          <table.Header
            cellClassName="px-2 py-1.5 pb-1.5 md:px-2 md:py-1.5 md:pb-1.5 text-xs/4 align-bottom"
            className={clsxm(
              "sticky top-0 z-10",
              RETRAIT_EN_TETE_PAR_NIVEAUX[niveauxRegroupement],
            )}
          />
          <table.Body
            cellClassName={clsxm(CELLULE, "border-t border-dsfr-grey-950")}
            className="[&>tr:nth-child(even)]:[--table-row-bg:theme(colors.white)]"
            renderGroupRow={(row) => (
              <LigneGroupeIndicateursACompleter
                className={CELLULE}
                deplie={row.getIsExpanded()}
                nombreColonnes={table.getVisibleLeafColumns().length}
                onBasculer={row.getToggleExpandedHandler()}
                premierNiveau={row.depth === 0 && niveauxRegroupement > 1}
                profondeur={row.depth}
                {...libelleGroupe({
                  colonne: row.groupingColumnId ?? "",
                  lignes: row.getLeafRows().map((feuille) => feuille.original),
                  avecChantier: avecChantierDansGroupe,
                })}
              />
            )}
            rowClassName={RETRAIT_DETAIL_PAR_NIVEAUX[niveauxRegroupement]}
          />
        </table.Root>
      </details>
    </div>
  );
};
