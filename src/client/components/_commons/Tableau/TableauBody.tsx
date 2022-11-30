import { flexRender } from '@tanstack/react-table';
import TableauBodyProps from './TableauBody.interface';

export default function TableauBody<T>({ tableau }: TableauBodyProps<T>) {
  return (
    <tbody>
      {tableau.getRowModel().rows.map(row => (
        <tr key={row.id}>
          {row.getVisibleCells().map(cell => (
            <td key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );    
}