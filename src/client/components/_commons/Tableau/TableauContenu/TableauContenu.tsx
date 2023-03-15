import { flexRender } from '@tanstack/react-table';
import TableauContenuProps from './TableauContenu.interface';

export default function TableauContenu<T>({ tableau }: TableauContenuProps<T>) {
  return (
    <tbody>
      {
        tableau.getRowModel().rows.map(row => (
          <tr
            className={`${row.getIsGrouped() ? 'ligne-groupée' : 'ligne-non-groupée'}`}
            key={row.id}
          >
            {
              row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  style={{
                    backgroundColor: cell.getIsAggregated() || cell.getIsGrouped() ? 'initial' : 'white',
                  }}
                >
                  {
                  cell.getIsGrouped() ? (
                    <button
                      onClick={row.getToggleExpandedHandler()}
                      style={{
                        fontWeight: row.getIsExpanded() ? 'bold' : undefined,
                        textAlign: 'left',
                      }}
                      type='button'
                    >
                      {
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )
                      }
                      { ` (${row.subRows.length})` }
                    </button>
                  )
                    : (cell.getIsAggregated() ? (
                      // If the cell is aggregated, use the Aggregated
                      // renderer for cell
                      flexRender(
                        cell.column.columnDef.aggregatedCell ??
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )
                    ) : flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    )
                    )
                }
                </td>
              ))
            }
          </tr>
        ))
      }
    </tbody>
  );    
}
