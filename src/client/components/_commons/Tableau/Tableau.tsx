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
import TableauHeader from './TableauHeader/TableauHeader';
import TableauBody from './TableauBody/TableauBody';
import Pagination from '../Pagination/Pagination';
import BarreDeRecherche from '../BarreDeRecherche/BarreDeRecherche';
import styles from './Tableau.module.scss';

export default function Tableau<T extends object>({ colonnes, donnees, titre, entités }: TableauProps<T>) {

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const tableau = useReactTable({
    data: donnees,
    columns: colonnes,
    globalFilterFn: (ligne, colonneId, filtreValeur)=>{
      return Boolean(ligne.getValue<T>(colonneId).toString().toLowerCase().includes(filtreValeur.toLowerCase()));
    },
    state: {
      globalFilter,
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleGlobalFilter = useCallback((event: ChangeEvent<HTMLInputElement>) =>{
    setGlobalFilter(event.target.value);
  }, [setGlobalFilter]);

  const changementDePageCallback = useCallback((numéroDePage: number) => tableau.setPageIndex(numéroDePage - 1), [tableau]);

  useEffect(() => {
    tableau.setPageSize(10);
  }, [tableau]);

  return (
    <div className="fr-table fr-table--bordered">
      <div className={styles.container}>
        <p>
          {donnees.length + ' ' + entités}
        </p>
        <BarreDeRecherche
          onChange={handleGlobalFilter}
          valeur={globalFilter}
        />
      </div>
      <table className={styles.tableau}>
        <caption>
          {titre}
        </caption>
        <TableauHeader<T> tableau={tableau} />
        <TableauBody<T> tableau={tableau} />
      </table>
      <Pagination
        changementDePageCallback={changementDePageCallback}
        nombreDePages={tableau.getPageCount()}
        numéroDePageInitiale={1}
      />
    </div>
  );
}