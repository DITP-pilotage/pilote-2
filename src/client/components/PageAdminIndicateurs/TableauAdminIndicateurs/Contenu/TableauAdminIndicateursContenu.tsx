import { flexRender, Row } from '@tanstack/react-table';
import { useCallback } from 'react';
import { useRouter } from 'next/router';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';
import TableauAdminIndicateursContenuProps
  from '@/components/PageAdminIndicateurs/TableauAdminIndicateurs/Contenu/TableauAdminIndicateursContenu.interface';

export default function TableauAdminIndicateursContenu({ tableau }: TableauAdminIndicateursContenuProps) {
  const router = useRouter();
  const auClicSurLaLigne = useCallback((row: Row<MetadataParametrageIndicateurContrat>) =>{
    router.push(`/admin/indicateurs/${row.original.indicId}`);
  }, [router]);

  return (
    <tbody>
      {
      tableau.getRowModel().rows.filter(Boolean).map(row => (
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
