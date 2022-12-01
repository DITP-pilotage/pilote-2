import { Header, SortDirection, flexRender } from '@tanstack/react-table';
import TableauEnTêteProps from './TableauEnTête.interface';

function renseignerAttributAriaSort(typeDeTri: false | SortDirection) {
  if (!typeDeTri)
    return 'none';
    
  const tupleTriAttributAriaSort = {
    asc: 'ascending',
    desc: 'descending',
  } as const;
  
  return tupleTriAttributAriaSort[typeDeTri];
}
  
function afficherIconeDeTriDeLaColonne(typeDeTri: false | SortDirection) {
  if (!typeDeTri)
    return null;
  
  const tupleTriClassName = {
    asc:'fr-icon-arrow-up-s-line',
    desc: 'fr-icon-arrow-down-s-line',
  };
  
  return (
    <span
      className={tupleTriClassName[typeDeTri]}
    />
  );
}

export default function TableauEnTête<T>({ tableau }: TableauEnTêteProps<T>) {
  const triSurUneColonneCallback = (header: Header<T, unknown>) => header.column.getToggleSortingHandler();

  return (
    <thead>
      {
        tableau.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th
                aria-sort={renseignerAttributAriaSort(header.column.getIsSorted())}
                key={header.id}
                onClick={triSurUneColonneCallback(header)}
              >
                <button type="button">
                  { flexRender(header.column.columnDef.header, header.getContext()) }
                  { afficherIconeDeTriDeLaColonne(header.column.getIsSorted()) }
                </button>
              </th>
            ))}
          </tr>
        ))
      }
    </thead>
  );
}