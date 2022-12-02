import '@gouvfr/dsfr/dist/component/table/table.min.css';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import TableauProps from './Tableau.interface';
import {
  getCoreRowModel, 
  getFilteredRowModel, 
  getPaginationRowModel, 
  getSortedRowModel, 
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import TableauEnTête from './TableauEnTête/TableauEnTête';
import TableauContenu from './TableauContenu/TableauContenu';
import TableauPagination from './TableauPagination/TableauPagination';
import TableauBarreDeRecherche from './TableauBarreDeRecherche/TableauBarreDeRecherche';
import Titre from '../Titre/Titre';
import styles from './Tableau.module.scss';

export default function Tableau<T extends object>({ colonnes, données, titre, entité }: TableauProps<T>) {
  const [tri, setTri] = useState<SortingState>([]);
  const [valeurDeLaRechercheGénérale, setValeurDeLaRechercheGénérale] = useState('');

  const tableau = useReactTable({
    data: données,
    columns: colonnes,
    globalFilterFn: (ligne, colonneId, filtreValeur)=>{
      return Boolean(ligne.getValue<T>(colonneId).toString().toLowerCase().includes(filtreValeur.toLowerCase()));
    },
    state: {
      globalFilter: valeurDeLaRechercheGénérale,
      sorting: tri,
    },
    onSortingChange: setTri,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useEffect(() => {
    tableau.setPageSize(10);
  }, [tableau]);

  const changementDeLaRechercheGénéraleCallback = useCallback((event: ChangeEvent<HTMLInputElement>) =>{
    setValeurDeLaRechercheGénérale(event.target.value);
  }, [setValeurDeLaRechercheGénérale]);

  const changementDePageCallback = useCallback((numéroDePage: number) => tableau.setPageIndex(numéroDePage - 1), [tableau]);

  return (
    <div className="fr-table fr-table--bordered">
      <Titre
        apparence="fr-h6"
        baliseHtml="h2"
      >
        {titre}
      </Titre>
      <div className={styles.conteneur}>
        <p className="fr-mt-1w">
          {`${tableau.getFilteredRowModel().rows.length} ${entité}`}
        </p>
        <TableauBarreDeRecherche
          changementDeLaRechercheGénéraleCallback={changementDeLaRechercheGénéraleCallback}
          valeur={valeurDeLaRechercheGénérale}
        />
      </div>
      {
        tableau.getRowModel().rows.length === 0 ?
          <>
            <p>
              Aucun 
              {' '}
              {entité}
              {' '}
              ne correspond à votre recherche !
            </p>
            <p>
              Vous pouvez modifier vos filtres pour élargir votre recherche.
            </p>
          </>
          :
          <table className={styles.tableau}>
            <caption className="fr-sr-only">
              {titre}
            </caption>
            <TableauEnTête<T> tableau={tableau} />
            <TableauContenu<T> tableau={tableau} />
          </table>
      }
      <TableauPagination
        changementDePageCallback={changementDePageCallback}
        nombreDePages={tableau.getPageCount()}
        numéroDePageInitiale={1}
      />
    </div>
  );
}
