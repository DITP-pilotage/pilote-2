import { flexRender } from '@tanstack/react-table';
import Link from 'next/link';
import TableauProjetsStructurantsContenuProps from './TableauProjetsStructurantsContenu.interface';


export default function TableauProjetsStructurantsContenu({ tableau }: TableauProjetsStructurantsContenuProps) {
  return (
    <tbody>
      {
        tableau.getRowModel().rows.map(row => (
          <tr
            className="ligne-projet-structurant"
            key={row.id}
          >
            {
              row.getVisibleCells().map(cell => (
                <td
                  className="fr-p-0"
                  key={cell.id}
                >
                  <Link
                    className="fr-p-1w"
                    href={`/projet-structurant/${row.original.id}`}
                    tabIndex={cell.column.columnDef.meta?.tabIndex}
                  >
                    { flexRender(cell.column.columnDef.cell, cell.getContext()) }
                  </Link>
                </td>
              ))
            }
          </tr>
        ))
      }
    </tbody>
  );    
}
