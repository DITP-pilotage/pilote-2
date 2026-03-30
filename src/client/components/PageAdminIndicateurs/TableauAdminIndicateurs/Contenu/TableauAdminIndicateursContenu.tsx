import { flexRender, Table } from "@tanstack/react-table";
import { FunctionComponent } from "react";
import { MetadataParametrageIndicateurInformationContrat } from "@/server/app/contrats/MetadataParametrageIndicateurContrat";

interface TableauAdminIndicateursContenuProps {
  tableau: Table<MetadataParametrageIndicateurInformationContrat>;
}

const TableauAdminIndicateursContenu: FunctionComponent<
  TableauAdminIndicateursContenuProps
> = ({ tableau }) => {
  return (
    <tbody>
      {tableau
        .getRowModel()
        .rows.filter(Boolean)
        .map((row) => (
          <tr
            className="cursor-pointer even:hover:bg-dsfr-grey-950-hover odd:hover:bg-dsfr-grey-975-hover"
            key={row.id}
          >
            {row.getVisibleCells().map((cell) => (
              <td
                className="fr-p-1w max-w-[20px] overflow-hidden text-ellipsis whitespace-nowrap"
                key={cell.id}
                title={cell.row.getValue(cell.column.id) || ""}
              >
                <a
                  className="no-underline bg-none"
                  href={`/panel-administrateur/indicateurs/${row.original.indicId}`}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </a>
              </td>
            ))}
          </tr>
        ))}
    </tbody>
  );
};

export default TableauAdminIndicateursContenu;
