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
import TableauHeader from './TableauHeader';
import TableauBody from './TableauBody';
import TableauPagination from './TableauPagination';

export default function Tableau<T extends object>({ colonnes, donnees, titre }: TableauProps<T>) {

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

  useEffect(() => {
    tableau.setPageSize(20);
  }, [tableau]);

  return (
    <div className="fr-table fr-table--bordered">
      <input
        onChange={handleGlobalFilter}
        placeholder="Rechercher"
        type='text'
        value={globalFilter ?? ''}
      />
      <table>
        <caption>
          {titre}
        </caption>
        <TableauHeader<T> tableau={tableau} />
        <TableauBody<T> tableau={tableau} />
      </table>
      <TableauPagination tableau={tableau} />
    </div>
  );
}