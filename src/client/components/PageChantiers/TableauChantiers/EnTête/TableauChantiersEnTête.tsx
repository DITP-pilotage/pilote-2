import { flexRender, SortDirection } from '@tanstack/react-table';
import BoutonsDeTri from '@/components/_commons/Tableau/TableauEnTête/BoutonsDeTri/BoutonsDeTri';
import TableauChantiersEnTêteProps from './TableauChantiersEnTête.interface';
import TableauChantiersEnTêteStyled from './TableauChantiersEnTête.styled';

function renseignerAttributAriaSort(typeDeTri: false | SortDirection) {
  if (!typeDeTri)
    return 'none';
  
  const tupleTriAttributAriaSort = {
    asc: 'ascending',
    desc: 'descending',
  } as const;

  return tupleTriAttributAriaSort[typeDeTri];
}

export default function TableauChantiersEnTête({ tableau }: TableauChantiersEnTêteProps) {
  return (
    <TableauChantiersEnTêteStyled>
      {
        tableau.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th
                aria-sort={renseignerAttributAriaSort(header.column.getIsSorted())} 
                key={header.id}
              >
                { flexRender(header.column.columnDef.header, header.getContext()) }
                { header.column.getCanSort() && (
                  <BoutonsDeTri
                    libellé={header.column.columnDef.header?.toString() ?? ''}
                    setTri={(tri) => tri === false ? header.column.clearSorting() : header.column.toggleSorting(tri === 'desc')}
                    tri={header.column.getIsSorted()}
                  />
                ) }
              </th>
            ))}
          </tr>
        ))
      }
    </TableauChantiersEnTêteStyled>
  );
}
