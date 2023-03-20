import { flexRender, Row } from '@tanstack/react-table';
import { useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  DonnéesTableauChantiers,
} from '@/components/PageChantiers/ListeChantiersTableau/ListeChantiersTableau.interface';
import ListeChantiersTableauContenuProps from './ListeChantiersTableauContenu.interface';

export default function ListeChantiersTableauContenu({ tableau }: ListeChantiersTableauContenuProps) {
  const router = useRouter();
  
  const auClicSurLaLigne = useCallback((row: Row<DonnéesTableauChantiers>) => {
    if (row.getIsGrouped()) {
      row.getToggleExpandedHandler()();
    } else {
      void router.push(`/chantier/${row.original.id}`);
    }
  }, [router]);

  return (
    <tbody>
      {
        tableau.getRowModel().rows.map(row => (
          <tr
            className={row.getIsGrouped() ? 'ligne-ministère' : 'ligne-chantier'}
            key={row.id}
            onClick={() => auClicSurLaLigne(row)}
          >
            {
              row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {
                    !cell.getIsGrouped() && (
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
                <span
                  aria-hidden="true"
                  className={`${row.getIsExpanded() ? 'fr-icon-arrow-down-s-line' : 'fr-icon-arrow-up-s-line'} icone`}
                />
              }
            </td>
          </tr>
        ))
      }
    </tbody>
  );    
}
