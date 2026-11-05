import { useId } from "react";
import { csvIndicateursACompleter } from "@/components/_commons/ChatUI/csvIndicateursACompleter";
import {
  libelleGroupe,
  pluriel,
  type Regroupement,
  type TableDetail,
  useTableauIndicateursACompleter,
} from "@/components/_commons/ChatUI/useTableauIndicateursACompleter";
import { Icone } from "@/components/_commons/Icone";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";
import { DownloadIcon } from "@/components/_commons/Icones/DownloadIcon";
import { MultiSelectFiltre } from "@/components/_commons/MultiSelectFiltre/MultiSelectFiltre";
import { Button } from "@/components/shared/Button";
import { Table } from "@/components/shared/Table";
import { LIBELLES_MOTIF } from "@/server/albert/tools/indicateursACompleter";
import type { DetailIndicateursACompleter } from "@/server/albert/tools/getIndicateursACompleter";
import { clsxm } from "@/utils/clsxm";

const CELLULE = "px-2 py-1.5 md:px-2 md:py-1.5 align-top text-[13px]/5";
const CONTROLE =
  "py-1 text-sm border rounded-t border-b-2 border-b-gray-600 bg-dsfr-contrast-grey";
// Classes littérales (Tailwind en `important` : un style en ligne ne passerait pas).
const RETRAIT_GROUPE_PAR_PROFONDEUR = ["pl-2 md:pl-2", "pl-7 md:pl-7"];
// Les lignes de détail s'alignent sur le libellé du dernier niveau de groupe.
const RETRAIT_DETAIL_PAR_NIVEAUX = [
  "pl-2 md:pl-2",
  "pl-8 md:pl-8",
  "pl-[3.25rem] md:pl-[3.25rem]",
];
const RETRAIT_EN_TETE_PAR_NIVEAUX = [
  "",
  "[&_th:first-child]:pl-8",
  "[&_th:first-child]:pl-[3.25rem]",
];

const telechargerCsv = ({ csv }: { csv: string }) => {
  const lien = document.createElement("a");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  lien.href = url;
  lien.download = `indicateurs-a-completer-${new Date().toISOString().slice(0, 10)}.csv`;
  lien.click();
  URL.revokeObjectURL(url);
};

const toStringArray = (valeur: unknown): string[] =>
  Array.isArray(valeur)
    ? valeur.filter((element): element is string => typeof element === "string")
    : [];

const BarreOutils = ({
  table,
  regroupement,
  regroupements,
  onRegroupementChange,
}: {
  table: TableDetail;
  regroupement: Regroupement;
  regroupements: readonly { value: Regroupement; label: string }[];
  onRegroupementChange: (regroupement: Regroupement) => void;
}) => {
  const regroupementId = useId();
  const colonnesFiltrables = table
    .getAllLeafColumns()
    .filter((column) => column.columnDef.meta?.filter != null);

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-dsfr-grey-925 px-4 py-2">
      <table.Search
        button="none"
        className="w-auto min-w-40 flex-1"
        inputClassName="px-3 py-1 text-sm"
        placeholder="Rechercher un territoire, un indicateur…"
      />
      {colonnesFiltrables.map((column) => {
        const filtre = column.columnDef.meta?.filter;
        if (!filtre) return null;
        const valeurs = toStringArray(column.getFilterValue());
        return (
          <MultiSelectFiltre
            className="w-auto"
            classNameBouton={clsxm(CONTROLE, "gap-2 px-3")}
            getOptionLabel={(valeur) =>
              filtre.options.find((option) => option.value === valeur)?.label ??
              valeur
            }
            getPlaceholder={(selection) =>
              selection.length === 0
                ? filtre.label
                : `${filtre.label} (${selection.length})`
            }
            key={column.id}
            onChange={(selection) => column.setFilterValue(selection)}
            classNameContenu="w-80 max-w-[90vw]"
            optionGroups={
              "groups" in filtre && filtre.groups
                ? filtre.groups.map((groupe) => ({
                    label: groupe.label,
                    options: groupe.values,
                  }))
                : [
                    {
                      label: "",
                      options: filtre.options.map((option) => option.value),
                    },
                  ]
            }
            showGroupSelection={"groups" in filtre && filtre.groups != null}
            showSearch={filtre.options.length > 8}
            values={valeurs}
          />
        );
      })}
      <div className="flex items-center gap-2 text-sm">
        <label
          className="whitespace-nowrap text-dsfr-grey-200"
          htmlFor={regroupementId}
        >
          Regrouper par
        </label>
        <div className="relative">
          <select
            className={clsxm(
              CONTROLE,
              "appearance-none pl-3 pr-8 font-medium cursor-pointer",
            )}
            id={regroupementId}
            onChange={(event) =>
              onRegroupementChange(event.target.value as Regroupement)
            }
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
      {table.hasActiveFilters() && (
        <Button onClick={table.resetFilters} size="sm" variant="link">
          Réinitialiser
        </Button>
      )}
    </div>
  );
};

const CorpsTableau = ({
  table,
  niveauxRegroupement,
  avecChantierDansGroupe,
}: {
  table: TableDetail;
  niveauxRegroupement: number;
  avecChantierDansGroupe: boolean;
}) => {
  const nombreColonnes = table.getVisibleLeafColumns().length;

  return (
    <Table.Body className="[&>tr:nth-child(even)]:[--table-row-bg:theme(colors.white)]">
      {table.getRowModel().rows.map((row) => {
        if (!row.getIsGrouped()) {
          return (
            <Table.Row key={row.id}>
              {row.getVisibleCells().map((cell, index) => (
                <Table.Cell
                  className={clsxm(
                    CELLULE,
                    "border-t border-dsfr-grey-950",
                    index === 0 &&
                      RETRAIT_DETAIL_PAR_NIVEAUX[niveauxRegroupement],
                    cell.column.columnDef.meta?.cellClassName,
                  )}
                  key={cell.id}
                >
                  <table.FlexRender cell={cell} />
                </Table.Cell>
              ))}
            </Table.Row>
          );
        }
        const { libelle, details } = libelleGroupe({
          colonne: row.groupingColumnId ?? "",
          lignes: row.getLeafRows().map((feuille) => feuille.original),
          avecChantier: avecChantierDansGroupe,
        });
        const premierNiveau = row.depth === 0 && niveauxRegroupement > 1;
        return (
          <Table.Row key={row.id}>
            <Table.Cell
              className={clsxm(
                CELLULE,
                "border-t",
                premierNiveau
                  ? "border-dsfr-blue-france-925 bg-dsfr-blue-france-950"
                  : "border-dsfr-grey-925",
                RETRAIT_GROUPE_PAR_PROFONDEUR[row.depth],
              )}
              colSpan={nombreColonnes}
            >
              <button
                aria-expanded={row.getIsExpanded()}
                className="box-border flex w-full items-baseline gap-2 p-0 text-left"
                onClick={row.getToggleExpandedHandler()}
                type="button"
              >
                <Icone
                  className={clsxm(
                    "h-4 w-4 shrink-0 self-center text-dsfr-blue-france-sun-113 transition-transform motion-reduce:transition-none",
                    !row.getIsExpanded() && "-rotate-90",
                  )}
                  icone={ArrowSLine2Icon}
                />
                <span
                  className={clsxm(
                    "min-w-0 flex-1 truncate",
                    premierNiveau ? "font-bold" : "font-medium",
                  )}
                  title={libelle}
                >
                  {libelle}
                </span>{" "}
                <span className="sr-only">·</span>{" "}
                <span className="shrink-0 whitespace-nowrap text-xs text-dsfr-mention-grey">
                  {details.join(" · ")}
                </span>
              </button>
            </Table.Cell>
          </Table.Row>
        );
      })}
    </Table.Body>
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
    <div className="border border-dsfr-grey-925 bg-white">
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
            telechargerCsv({
              csv: csvIndicateursACompleter({
                lignes: lignesFiltrees,
                motifs: detail.motifs,
              }),
            });
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
        <BarreOutils
          onRegroupementChange={setRegroupement}
          regroupement={regroupement}
          regroupements={regroupements}
          table={table}
        />
        <table.Root
          caption="Détail des indicateurs à compléter"
          captionHidden
          className="table-fixed"
          containerClassName="max-h-[28rem] overflow-y-auto border-t border-dsfr-grey-925"
          empty={{ title: "Aucune ligne ne correspond à ces filtres." }}
        >
          <table.Header
            cellClassName="px-2 py-1.5 pb-1.5 md:px-2 md:py-1.5 md:pb-1.5 text-xs/4 align-bottom"
            className={clsxm(
              "sticky top-0 z-10",
              RETRAIT_EN_TETE_PAR_NIVEAUX[niveauxRegroupement],
            )}
          />
          <CorpsTableau
            avecChantierDansGroupe={avecChantierDansGroupe}
            niveauxRegroupement={niveauxRegroupement}
            table={table}
          />
        </table.Root>
      </details>
    </div>
  );
};
