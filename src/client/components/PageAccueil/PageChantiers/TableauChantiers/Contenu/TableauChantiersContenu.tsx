import { Cell, flexRender, Table } from '@tanstack/react-table';
import Link from 'next/link';
import { FunctionComponent } from 'react';
import { ChantierVueDEnsemble } from '@/server/domain/chantier/Chantier.interface';
import {
  DonnéesTableauChantiers,
} from '@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface';

function afficherContenuDeLaCellule(cell: Cell<ChantierVueDEnsemble, unknown>) {
  return !cell.getIsGrouped() && (
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
  );
}

interface TableauChantiersContenuProps {
  tableau: Table<DonnéesTableauChantiers>
  territoireCode: string
  mailleSelectionnee: 'départementale' | 'régionale'
}

const TableauChantiersContenu: FunctionComponent<TableauChantiersContenuProps> = ({
  tableau,
  territoireCode,
  mailleSelectionnee,
}) => {
  return (
    <tbody>
      {
      tableau.getRowModel().rows.map(row => (
        row.getIsGrouped() ? (
          <tr
            className='ligne-ministère'
            key={row.id}
            onClick={() => row.getToggleExpandedHandler()()}
          >
            {
              row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {afficherContenuDeLaCellule(cell)}
                </td>
              ))
            }
          </tr>
        ) : (
          <tr
            className='ligne-chantier'
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
                    href={`/chantier/${row.original.id}/${territoireCode}?maille=${mailleSelectionnee}`}
                    tabIndex={cell.column.columnDef.meta?.tabIndex}
                  >
                    {afficherContenuDeLaCellule(cell)}
                  </Link>
                </td>
              ))
            }
          </tr>
        )
      ))
    }
    </tbody>
  );
};

export default TableauChantiersContenu;
