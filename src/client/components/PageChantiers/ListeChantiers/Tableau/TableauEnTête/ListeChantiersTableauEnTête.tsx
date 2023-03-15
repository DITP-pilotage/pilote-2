import { Header, flexRender, SortDirection } from '@tanstack/react-table';
import ListeChantiersTableauEnTêteProps from './ListeChantiersTableauEnTête.interface';
import FlècheDeTri from './FlècheDeTri/FlècheDeTri';
import ListeChantiersTableauEnTêteStyled from './ListeChantiersTableauEnTête.styled';

function renseignerAttributAriaSort(typeDeTri: false | SortDirection) {
  if (!typeDeTri)
    return 'none';
  
  const tupleTriAttributAriaSort = {
    asc: 'ascending',
    desc: 'descending',
  } as const;

  return tupleTriAttributAriaSort[typeDeTri];
}


export default function ListeChantiersTableauEnTête<T>({ tableau }: ListeChantiersTableauEnTêteProps<T>) {
  function afficherIconesDeTriDeLaColonne(header:  Header<T, unknown>) {
    const triDécroissantActif = header.column.getIsSorted() === 'desc';
    const triCroissantActif = header.column.getIsSorted() === 'asc';
    return (
      <>
        <button
          aria-label={`trier la colonne ${header.column.columnDef.header} par ordre croissant`}
          className={`${triCroissantActif ? 'actif' : ''} flèche-de-tri fr-m-1w`}
          onClick={() => header.column.toggleSorting(false)}
          type='button'
        >
          <FlècheDeTri
            direction='asc'
            estActif={triCroissantActif}
          />
        </button>
        <button
          aria-label={`trier la colonne ${header.column.columnDef.header} par ordre décroissant`}
          className={`${triDécroissantActif ? 'actif' : ''} flèche-de-tri`}
          onClick={() => header.column.toggleSorting(true)}
          type='button'
        >
          <FlècheDeTri
            direction='desc'
            estActif={triDécroissantActif}
          />
        </button>
      </>
    );
  }
  
  return (
    <ListeChantiersTableauEnTêteStyled>
      {
        tableau.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th
                aria-sort={renseignerAttributAriaSort(header.column.getIsSorted())} 
                key={header.id}
              >
                { flexRender(header.column.columnDef.header, header.getContext()) }
                { header.column.getCanSort() && afficherIconesDeTriDeLaColonne(header) }
              </th>
            ))}
            <th />
          </tr>
        ))
      }
    </ListeChantiersTableauEnTêteStyled>
  );
}
