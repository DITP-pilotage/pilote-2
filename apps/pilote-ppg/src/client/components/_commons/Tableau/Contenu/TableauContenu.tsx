import { TableauAvecLignes } from "../typesTableau";
import { flexRender } from "@tanstack/react-table";
import {
  TableauCellule,
  TableauCorps,
  TableauLigne,
} from "@/components/shared/Tableau";

interface TableauContenuProps<TContexte extends object> {
  tableau: TableauAvecLignes<TContexte>;
}

export default function TableauContenu<TContexte extends object>({
  tableau,
}: TableauContenuProps<TContexte>) {
  return (
    <TableauCorps>
      {tableau.getRowModel().rows.map((row) => (
        <TableauLigne key={row.id}>
          {row.getVisibleCells().map((cell) => (
            <TableauCellule
              className="py-0 md:py-2 px-1 min-[62rem]:px-4"
              key={cell.id}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableauCellule>
          ))}
        </TableauLigne>
      ))}
    </TableauCorps>
  );
}
