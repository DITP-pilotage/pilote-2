import { flexRender, Table } from '@tanstack/react-table';
import Link from 'next/link';
import { FunctionComponent } from 'react';
import { ProjetStructurantVueDEnsemble } from '@/server/domain/projetStructurant/ProjetStructurant.interface';

interface TableauProjetsStructurantsContenuProps {
  tableau: Table<ProjetStructurantVueDEnsemble>
}

const TableauProjetsStructurantsContenu: FunctionComponent<TableauProjetsStructurantsContenuProps> = ({ tableau }) => {
  return (
    <tbody>
      {
        tableau.getRowModel().rows.map(row => (
          <tr
            className='ligne-projet-structurant'
            key={row.id}
          >
            {
              row.getVisibleCells().map(cell => (
                <td
                  className='fr-p-0'
                  key={cell.id}
                >
                  <Link
                    className='fr-p-1w'
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
};

export default TableauProjetsStructurantsContenu;
