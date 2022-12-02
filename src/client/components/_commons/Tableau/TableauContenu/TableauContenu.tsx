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
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))
            }
          </tr>
        ))
      }
    </tbody>
  );    
}