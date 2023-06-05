import { Cell, flexRender } from '@tanstack/react-table';
import Link from 'next/link';
import { ChantierVueDEnsemble } from '@/server/domain/chantier/Chantier.interface';
import TableauChantiersContenuProps from './TableauChantiersContenu.interface';

function afficherContenuDeLaCellule(cell: Cell<ChantierVueDEnsemble, unknown>) {
  return !cell.getIsGrouped() && (
    cell.getIsAggregated() ? (
      flexRender(
        cell.column.columnDef.aggregatedCell ??
        cell.column.columnDef.cell,
        cell.getContext(),
      )
    ) : flexRender(
      cell.column.columnDef.cell,
      cell.getContext(),
    )
  );
}

export default function TableauChantiersContenu({ tableau }: TableauChantiersContenuProps) {
  return (
    <tbody>
      {
        tableau.getRowModel().rows.map(row => (
          row.getIsGrouped() ? (
            <tr
              className="ligne-ministère"
              key={row.id}
              onClick={() => row.getToggleExpandedHandler()()}
            >
              {
                row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    { afficherContenuDeLaCellule(cell) }
                  </td>
                ))
              }
            </tr>
          ) : (
            <tr
              className="ligne-chantier"
              key={row.id}
            >
              {
                row.getVisibleCells().map(cell => (
                  <td
                    className="fr-p-0"
                    key={cell.id}
                  >
                    <Link
                      className="fr-p-2w"
                      href={`/chantier/${row.original.id}`}
                    >
                      { afficherContenuDeLaCellule(cell) }
                    </Link>
                  </td>
                ))
              }
            </tr>
          )
        ))
      }
    </tbody>
  );    
}
