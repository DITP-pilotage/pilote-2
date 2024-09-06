import { flexRender, Row, Table } from '@tanstack/react-table';
import { FunctionComponent, useCallback } from 'react';
import { useRouter } from 'next/router';
import { htmlId } from '@/components/PageRapportDétaillé/PageRapportDétaillé';
import {
  DonnéesTableauChantiers,
} from '@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface';

interface TableauChantiersContenuProps {
  tableau: Table<DonnéesTableauChantiers>
}

const RapportDétailléTableauChantiersContenu: FunctionComponent<TableauChantiersContenuProps> = ({ tableau }) => {
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
};

export default RapportDétailléTableauChantiersContenu;
