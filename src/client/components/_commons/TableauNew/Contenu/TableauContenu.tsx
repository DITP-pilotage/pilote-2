import { flexRender } from '@tanstack/react-table';
import TableauContenuProps from './TableauContenu.interface';

export default function TableauContenu<T>({ tableau }: TableauContenuProps<T>) {
  return (
    <tbody>
      {
        tableau.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {
              row.getVisibleCells().map(cell => (
                <td
                  className='fr-py-0 fr-py-md-1w fr-px-1v fr-px-lg-2w'
                  key={cell.id}
                >
                  {
                    flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
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
