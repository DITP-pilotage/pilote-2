import { TableauAvecLignes } from "../typesTableau";
import { flexRender } from "@tanstack/react-table";

interface TableauContenuProps<TContexte extends object> {
  tableau: TableauAvecLignes<TContexte>;
}

export default function TableauContenu<TContexte extends object>({
  tableau,
}: TableauContenuProps<TContexte>) {
  return (
    <tbody>
      {tableau.getRowModel().rows.map((row) => (
        <tr key={row.id}>
          {row.getVisibleCells().map((cell) => (
            <td
              className="fr-py-0 fr-py-md-1w fr-px-1v fr-px-lg-2w"
              key={cell.id}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
