import { ChangeEvent, useCallback, useState } from 'react';
import TableauProps from './Tableau.interface';
import {
  flexRender,
  getCoreRowModel, getFilteredRowModel, getSortedRowModel, Header, SortDirection, SortingState,
  useReactTable,
} from '@tanstack/react-table';

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

export default function Tableau<T extends object>({ colonnes, donnees, titre }: TableauProps<T>) {

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data: donnees,
    columns: colonnes,
    globalFilterFn: (row, colonneId, filterValue)=>{
      return Boolean(row.getValue<T>(colonneId).toString().toLowerCase().includes(filterValue.toLowerCase()));
    },
    state: {
      globalFilter,
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleGlobalFilter = useCallback((event: ChangeEvent<HTMLInputElement>) =>{
    setGlobalFilter(event.target.value);
  }, [setGlobalFilter]);
  const handleSortColumn = (header: Header<T, unknown>) => header.column.getToggleSortingHandler();
  

  return (
    <div className="fr-table fr-table--bordered">
      <input
        onChange={handleGlobalFilter}
        placeholder="Search all columns..."
        type='text'
        value={globalFilter ?? ''}
      />
      <table>
        <caption>
          {titre}
        </caption>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  aria-sort={renseignerAttributAriaSort(header.column.getIsSorted())}
                  key={header.id}
                  onClick={handleSortColumn(header)}
                >
                  <button type="button">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    { afficherIconeDeTriDeLaColonne(header.column.getIsSorted()) }
                  </button>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}