import { flexRender, SortDirection, Table } from '@tanstack/react-table';
import BoutonsDeTri from '@/components/_commons/Tableau/EnTête/BoutonsDeTri/BoutonsDeTri';
import TableauEnTêteStyled from './TableauEnTête.styled';

interface TableauEnTêteProps<T> {
  tableau: Table<T>
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

export default function TableauEnTête<T>({ tableau }: TableauEnTêteProps<T>) {
  return (
    <TableauEnTêteStyled>
      {
        tableau.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th
                aria-sort={renseignerAttributAriaSort(header.column.getIsSorted())}
                className='fr-py-1w fr-px-1v fr-px-lg-2w'
                key={header.id}
                style={{
                  width: header.column.columnDef.meta?.width ?? undefined,
                }}
              >
                <p className='fr-mb-0 fr-text--sm label'>
                  { flexRender(header.column.columnDef.header, header.getContext()) }
                </p>
                { header.column.getCanSort() && (
                  <BoutonsDeTri
                    changementDirectionDeTriCallback={(tri) => tri === false ? header.column.clearSorting() : header.column.toggleSorting(tri === 'desc')}
                    directionDeTri={header.column.getIsSorted()}
                    nomColonneÀTrier={header.column.columnDef.id ?? ''}
                  />
                ) }
              </th>
            ))}
          </tr>
        ))
      }
    </TableauEnTêteStyled>
  );
}
