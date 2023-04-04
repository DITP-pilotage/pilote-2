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
                <p className="fr-mb-0 fr-mr-3v fr-text--sm">
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
    </TableauChantiersEnTêteStyled>
  );
}
