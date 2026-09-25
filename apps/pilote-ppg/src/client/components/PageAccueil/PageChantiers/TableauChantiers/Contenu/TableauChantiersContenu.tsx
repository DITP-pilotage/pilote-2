import { flexRender } from "@tanstack/react-table";
import Link from "next/link";
import { FunctionComponent } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import type { TableauDesChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/useTableauChantiers";
import { clsxm } from "@/utils/clsxm";
import {
  TableauCellule,
  TableauCorps,
  TableauLigne,
} from "@/components/shared/Tableau";

type LigneDeChantiers = ReturnType<
  TableauDesChantiers["getRowModel"]
>["rows"][number];

type CelluleDeChantiers = ReturnType<
  LigneDeChantiers["getVisibleCells"]
>[number];

/**
 * En v9 `cell.getIsAggregated()` n'est vrai que si la colonne porte une fonction
 * d'agrégation résolue, alors que la v8 le renvoyait pour toute cellule d'une
 * ligne de regroupement. On retient ici la règle v8 : sur une ligne de
 * regroupement, c'est le gabarit agrégé qui s'affiche.
 */
function afficherContenuDeLaCellule(cellule: CelluleDeChantiers) {
  if (cellule.getIsGrouped()) {
    return null;
  }

  const gabarit = cellule.row.getIsGrouped()
    ? (cellule.column.columnDef.aggregatedCell ?? cellule.column.columnDef.cell)
    : cellule.column.columnDef.cell;

  return flexRender(gabarit, cellule.getContext());
}

interface TableauChantiersContenuProps {
  tableau: TableauDesChantiers;
  territoireCode: string;
  jalon: number;
  chantiersSontArchives: boolean;
}

const TableauChantiersContenu: FunctionComponent<
  TableauChantiersContenuProps
> = ({ tableau, territoireCode, jalon, chantiersSontArchives }) => {
  const [mailleSelectionnee] = useQueryState(
    "maille",
    parseAsStringLiteral(["departementale", "regionale"]).withDefault(
      "departementale",
    ),
  );

  return (
    <TableauCorps>
      {tableau.getRowModel().rows.map((row) =>
        row.getIsGrouped() ? (
          <TableauLigne
            className="h-[4.5rem] not-first:border-t-primary not-first:border-t-2 bold cursor-pointer bg-white bg-[image:linear-gradient(0deg,theme(colors.dsfr-grey-900),theme(colors.dsfr-grey-900))] bg-no-repeat bg-bottom bg-[size:100%_1px] [@media(hover:hover)]:hover:bg-dsfr-grey-1000"
            key={row.id}
            onClick={() => row.getToggleExpandedHandler()()}
            zebre={false}
          >
            {row.getVisibleCells().map((cell) => (
              <TableauCellule key={cell.id}>
                {afficherContenuDeLaCellule(cell)}
              </TableauCellule>
            ))}
          </TableauLigne>
        ) : (
          <TableauLigne
            className={clsxm(
              "h-[4.5rem]",
              chantiersSontArchives
                ? "even:bg-dsfr-contrast-grey odd:bg-dsfr-grey-1000 even:hover:bg-dsfr-grey-950-hover odd:hover:bg-dsfr-grey-975-hover"
                : "even:bg-dsfr-blue-france-950 odd:bg-dsfr-alt-blue-france even:hover:bg-dsfr-blue-france-950-hover odd:hover:bg-dsfr-blue-france-975-hover",
            )}
            key={row.id}
          >
            {row.getVisibleCells().map((cell) => {
              const mailleRedirection =
                !row.original.maillesApplicables.includes("departementale")
                  ? row.original.maillesApplicables.includes("regionale")
                    ? "regionale"
                    : mailleSelectionnee
                  : mailleSelectionnee;
              return (
                <TableauCellule className="p-0" key={cell.id}>
                  <Link
                    className="pl-4 pr-4 py-2 flex items-center h-full no-underline bg-none"
                    href={`/chantier/${row.original.id}/${territoireCode}?maille=${mailleRedirection}&jalon=${jalon}`}
                    tabIndex={cell.column.columnDef.meta?.tabIndex}
                  >
                    {afficherContenuDeLaCellule(cell)}
                  </Link>
                </TableauCellule>
              );
            })}
          </TableauLigne>
        ),
      )}
    </TableauCorps>
  );
};

export default TableauChantiersContenu;
