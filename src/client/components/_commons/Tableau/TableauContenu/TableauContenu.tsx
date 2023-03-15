import { flexRender } from '@tanstack/react-table';
import TableauContenuProps from './TableauContenu.interface';

export default function TableauContenu<T>({ tableau }: TableauContenuProps<T>) {
  return (
    <tbody>
      {
        tableau.getRowModel().rows.map(row => (
          <tr
            className={`${row.getIsGrouped() && 'ligne-groupée'}`}
            key={row.id}
          >
            {
              row.getVisibleCells().map(cell => (
                <td key={cell.id} >
                  {
                    cell.getIsGrouped() === false && (
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
                    )
                  }
                </td>
              ))
            }
            <td>

              {
                row.getIsGrouped() &&
                  <button
                    onClick={row.getToggleExpandedHandler()}
                    type='button'
                  >
                    <span
                      aria-hidden="true"
                      className={`${row.getIsExpanded() ? 'fr-icon-arrow-down-s-line' : 'fr-icon-arrow-up-s-line'} icone`}
                    />
                  </button>
              }
            </td>
          </tr>
        ))
      }
    </tbody>
  );    
}
