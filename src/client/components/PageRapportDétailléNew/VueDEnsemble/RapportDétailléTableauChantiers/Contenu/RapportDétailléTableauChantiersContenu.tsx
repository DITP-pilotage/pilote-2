import { flexRender, Row } from '@tanstack/react-table';
import { useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  DonnéesTableauChantiers,
} from '@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface';
import { htmlId } from '@/components/PageRapportDétailléNew/PageRapportDétaillé';
import TableauChantiersContenuProps from './RapportDétailléTableauChantiersContenu.interface';

export default function RapportDétailléTableauChantiersContenu({ tableau }: TableauChantiersContenuProps) {
  const router = useRouter();

  const auClicSurLaLigne = useCallback((row: Row<DonnéesTableauChantiers>) => {
    if (row.getIsGrouped()) {
      row.getToggleExpandedHandler()();
    } else {
      void router.push(`#${htmlId.chantier(row.original.id)}`);
    }
  }, [router]);

  return (
    <tbody>
      {
      tableau.getRowModel().rows.map(row => (
        <tr
          className='ligne-chantier'
          key={row.id}
          onClick={() => auClicSurLaLigne(row)}
        >
          {
            row.getVisibleCells().map(cell => (
              <td key={cell.id}>
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
