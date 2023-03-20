import { getCoreRowModel, getExpandedRowModel, getFilteredRowModel,  getGroupedRowModel,  getPaginationRowModel,  getSortedRowModel,  GroupingState,  SortingState, useReactTable } from '@tanstack/react-table';
import { ChangeEvent, useCallback, useState } from 'react';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import ListeChantiersTableauProps, { DonnéesTableauChantiers } from './ListeChantiersTableau.interface';


export default function useListeChantiersTableau(données: ListeChantiersTableauProps['données'], colonnes: ListeChantiersTableauProps['colonnes']) {
  const [valeurDeLaRecherche, setValeurDeLaRecherche] = useState('');
  const [tri, setTri] = useState<SortingState>([]);
  const [regroupement, setRegroupement] = useState<GroupingState>([]);

  const tableau = useReactTable({
    data: données,
    columns: colonnes,
    globalFilterFn: (ligne, colonneId, filtreValeur) => {
      return rechercheUnTexteContenuDansUnContenant(filtreValeur, ligne.getValue<DonnéesTableauChantiers>(colonneId).toString());
    },
    state: {
      globalFilter: valeurDeLaRecherche,
      sorting: tri,
      grouping: regroupement,
      columnVisibility: {
        porteur: false,
      },
    },
    onSortingChange: setTri,
    onGroupingChange: setRegroupement,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const changementDeLaRechercheCallback = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setValeurDeLaRecherche(event.target.value);
  }, [setValeurDeLaRecherche]);

  const changementDePageCallback = useCallback((numéroDePage: number) => tableau.setPageIndex(numéroDePage - 1), [tableau]);  

  return {
    tableau,
    changementDeLaRechercheCallback,
    changementDePageCallback,
    valeurDeLaRecherche,
  };
}
