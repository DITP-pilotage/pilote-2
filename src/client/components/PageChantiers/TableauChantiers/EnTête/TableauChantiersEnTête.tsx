import { Header, flexRender, SortDirection } from '@tanstack/react-table';
import FlècheDeTri from '@/components/_commons/Tableau/TableauEnTête/FlècheDeTri/FlècheDeTri';
import { DonnéesTableauChantiers } from '@/client/components/PageChantiers/TableauChantiers/TableauChantiers.interface';
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
  function afficherIconesDeTriDeLaColonne(header: Header<DonnéesTableauChantiers, unknown>) {
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
                { header.column.getCanSort() && afficherIconesDeTriDeLaColonne(header) }
              </th>
            ))}
          </tr>
        ))
      }
    </TableauChantiersEnTêteStyled>
  );
}
