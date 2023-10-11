import { flexRender, SortDirection } from '@tanstack/react-table';
import TableauRéformesEnTêteProps from './TableauRéformesEnTête.interface';
import TableauRéformesEnTêteStyled from './TableauRéformesEnTête.styled';

function renseignerAttributAriaSort(typeDeTri: false | SortDirection) {
  if (!typeDeTri)
    return 'none';
  
  const tupleTriAttributAriaSort = {
    asc: 'ascending',
    desc: 'descending',
  } as const;

  return tupleTriAttributAriaSort[typeDeTri];
}

export default function TableauRéformesEnTête({ tableau }: TableauRéformesEnTêteProps) {
  return (
    <TableauRéformesEnTêteStyled>
      {
        tableau.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th
                className='fr-px-1w'
                aria-sort={renseignerAttributAriaSort(header.column.getIsSorted())}
                key={header.id}
                style={{
                  width: header.column.columnDef.meta?.width ?? undefined,
                }}
              >
                <p className="fr-mb-0 fr-text--xs">
                  { flexRender(header.column.columnDef.header, header.getContext()) }
                </p>
              </th>
            ))}
          </tr>
        ))
      }
    </TableauRéformesEnTêteStyled>
  );
}
