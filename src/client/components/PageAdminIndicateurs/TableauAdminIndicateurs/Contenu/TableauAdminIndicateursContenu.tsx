import { flexRender, Table } from '@tanstack/react-table';
import { FunctionComponent } from 'react';
import { MetadataParametrageIndicateurContrat } from '@/server/app/contrats/MetadataParametrageIndicateurContrat';

interface TableauAdminIndicateursContenuProps {
  tableau: Table<MetadataParametrageIndicateurContrat>
}

const TableauAdminIndicateursContenu: FunctionComponent<TableauAdminIndicateursContenuProps> = ({ tableau }) => {
  return (
    <tbody>
      {
      tableau.getRowModel().rows.filter(Boolean).map(row => (
        <tr
          key={row.id}
        >
          {
            row.getVisibleCells().map(cell => (
              <td
                className='fr-p-1w'
                key={cell.id}
                title={cell.row.getValue(cell.column.id)}
              >
                <a
                  className='no-underline bg-none'
                  href={`/admin/indicateurs/${row.original.indicId}`}
                >
                  {
                    flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    )
                  }
                </a>
              </td>
            ))
          }
        </tr>
      ))
    }
    </tbody>
  );
};

export default TableauAdminIndicateursContenu;
