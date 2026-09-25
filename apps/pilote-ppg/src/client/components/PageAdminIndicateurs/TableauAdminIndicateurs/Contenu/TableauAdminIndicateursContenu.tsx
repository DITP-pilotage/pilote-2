import { flexRender, type Table } from "@tanstack/react-table";
import { FunctionComponent } from "react";
import type { FeaturesTableauAdminIndicateurs } from "@/components/PageAdminIndicateurs/TableauAdminIndicateurs/useTableauAdminIndicateurs";
import {
  TableauCellule,
  TableauCorps,
  TableauLigne,
} from "@/components/shared/Tableau";
import { MetadataParametrageIndicateurInformationContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";

interface TableauAdminIndicateursContenuProps {
  tableau: Table<
    FeaturesTableauAdminIndicateurs,
    MetadataParametrageIndicateurInformationContrat
  >;
}

const TableauAdminIndicateursContenu: FunctionComponent<
  TableauAdminIndicateursContenuProps
> = ({ tableau }) => {
  return (
    <TableauCorps>
      {tableau
        .getRowModel()
        .rows.filter(Boolean)
        .map((row) => (
          <TableauLigne
            className="cursor-pointer even:hover:bg-dsfr-grey-950-hover odd:hover:bg-dsfr-grey-975-hover"
            key={row.id}
          >
            {row.getVisibleCells().map((cell) => (
              <TableauCellule
                className="p-2 max-w-[20px] overflow-hidden text-ellipsis whitespace-nowrap"
                key={cell.id}
                title={cell.row.getValue(cell.column.id) || ""}
              >
                <a
                  className="no-underline bg-none"
                  href={`/panel-administrateur/indicateurs/${row.original.indicId}`}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </a>
              </TableauCellule>
            ))}
          </TableauLigne>
        ))}
    </TableauCorps>
  );
};

export default TableauAdminIndicateursContenu;
