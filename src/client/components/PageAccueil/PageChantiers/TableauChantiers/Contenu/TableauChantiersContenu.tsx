import { Cell, flexRender, Table } from "@tanstack/react-table";
import Link from "next/link";
import { FunctionComponent } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { ChantierVueDEnsemble } from "@/server/domain/chantier/Chantier.interface";
import { DonnéesTableauChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface";
import { clsxm } from "@/utils/clsxm";

function afficherContenuDeLaCellule(cell: Cell<ChantierVueDEnsemble, unknown>) {
  return (
    !cell.getIsGrouped() &&
    (cell.getIsAggregated()
      ? flexRender(
          cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
          cell.getContext(),
        )
      : flexRender(cell.column.columnDef.cell, cell.getContext()))
  );
}

interface TableauChantiersContenuProps {
  tableau: Table<DonnéesTableauChantiers>;
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
    <tbody>
      {tableau.getRowModel().rows.map((row) =>
        row.getIsGrouped() ? (
          <tr
            className="h-[4.5rem] not-first:border-t-primary not-first:border-t-2 bold cursor-pointer bg-white bg-[image:linear-gradient(0deg,var(--border-default-grey),var(--border-default-grey))] bg-no-repeat bg-bottom bg-[size:100%_1px] [@media(hover:hover)]:hover:bg-[var(--background-default-grey-hover)]"
            key={row.id}
            onClick={() => row.getToggleExpandedHandler()()}
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{afficherContenuDeLaCellule(cell)}</td>
            ))}
          </tr>
        ) : (
          <tr
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
                <td className="fr-p-0" key={cell.id}>
                  <Link
                    className="pl-4 pr-4 py-2 flex items-center h-full no-underline bg-none children:w-full"
                    href={`/chantier/${row.original.id}/${territoireCode}?maille=${mailleRedirection}&jalon=${jalon}`}
                    tabIndex={cell.column.columnDef.meta?.tabIndex}
                  >
                    {afficherContenuDeLaCellule(cell)}
                  </Link>
                </td>
              );
            })}
          </tr>
        ),
      )}
    </tbody>
  );
};

export default TableauChantiersContenu;
