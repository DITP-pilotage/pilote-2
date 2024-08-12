import { flexRender, Row, Table } from '@tanstack/react-table';
import { FunctionComponent, useCallback } from 'react';
import { useRouter } from 'next/router';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

interface TableauAdminUtilisateursContenuProps {
  tableau: Table<Utilisateur>
}

const TableauAdminUtilisateursContenu: FunctionComponent<TableauAdminUtilisateursContenuProps> = ({ tableau }) => {
  const router = useRouter();
  const auClicSurLaLigne = useCallback((row: Row<Utilisateur>) =>{
    router.push(`/admin/utilisateur/${row.original.id}`);
  }, [router]);

  return (
    <tbody>
      {
      tableau.getRowModel().rows.map(row => (
        <tr
          key={row.id}
          onClick={() => auClicSurLaLigne(row)}
        >
          {
            row.getVisibleCells().map(cell => (
              <td
                className='fr-py-1w'
                key={cell.id}
                title={cell.row.getValue(cell.column.id)}
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
};

export default TableauAdminUtilisateursContenu;
