import { flexRender, SortDirection, Table } from '@tanstack/react-table';
import { FunctionComponent } from 'react';
import TableauRéformesEnTêteStyled from './TableauRéformesEnTête.styled';

interface TableauRéformesEnTêteProps {
  tableau: Table<any>
}

function renseignerAttributAriaSort(typeDeTri: false | SortDirection) {
  if (!typeDeTri)
    return 'none';
  
  const tupleTriAttributAriaSort = {
    asc: 'ascending',
    desc: 'descending',
  } as const;

  return tupleTriAttributAriaSort[typeDeTri];
}

const TableauRéformesEnTête: FunctionComponent<TableauRéformesEnTêteProps> = ({ tableau }) => {
  return (
    <TableauRéformesEnTêteStyled>
      {
        tableau.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th
                aria-sort={renseignerAttributAriaSort(header.column.getIsSorted())}
                className='fr-px-1w'
                key={header.id}
                style={{
                  width: header.column.columnDef.meta?.width ?? undefined,
                }}
              >
                <p className='fr-mb-0 fr-text fr-text--sm title'>
                  { flexRender(header.column.columnDef.header, header.getContext()) }
                </p>
              </th>
            ))}
          </tr>
        ))
      }
    </TableauRéformesEnTêteStyled>
  );
};

export default TableauRéformesEnTête;
