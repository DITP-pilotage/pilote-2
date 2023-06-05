import { flexRender, Row } from '@tanstack/react-table';
import { useCallback } from 'react';
import { useRouter } from 'next/router';
import TableauAdminUtilisateursContenuProps
  from '@/components/PageAdminUtilisateurs/TableauAdminUtilisateurs/Contenu/TableauAdminUtilisateursContenu.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

export default function TableauAdminUtilisateursContenu({ tableau }: TableauAdminUtilisateursContenuProps) {
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
                className="fr-py-1w"
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
}
