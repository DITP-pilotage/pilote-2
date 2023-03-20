import {
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  GroupingState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChangeEvent, useCallback, useState } from 'react';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import { comparerMétéo } from '@/client/utils/chantier/météo/météo';
import { comparerAvancementChantier } from '@/client/utils/chantier/avancement/avancement';
import TableauChantiersAvancement
  from '@/components/PageChantiers/TableauChantiers/Avancement/TableauChantiersAvancement';
import TableauChantiersMétéo from '@/components/PageChantiers/TableauChantiers/Météo/TableauChantiersMétéo';
import TableauChantiersProps, { DonnéesTableauChantiers } from './TableauChantiers.interface';


const déterminerTypologieDuGroupementParMinistère = (chantiersDuGroupe: DonnéesTableauChantiers[]) => {
  return chantiersDuGroupe.some(chantier => chantier.estBaromètre);
};

const reactTableColonnesHelper = createColumnHelper<DonnéesTableauChantiers>();

const colonnesTableauChantiers = [
  reactTableColonnesHelper.accessor('porteur', {
    header: 'Porteur',
    cell: porteur => porteur.getValue(),
    enableGrouping: true,
  }),
  reactTableColonnesHelper.accessor('nom', {
    header: 'Chantiers',
    aggregatedCell: nom => nom.row.original.porteur,
    enableSorting: false,
    enableGrouping: false,
  }),
  reactTableColonnesHelper.accessor('estBaromètre', {
    header: 'Typologie',
    enableSorting: false,
    cell: estBarometre => estBarometre.getValue() ? <PictoBaromètre taille={{ mesure: 1.25, unité: 'rem' }} /> : null,
    enableGrouping: false,
    aggregationFn: (_columnId, leafRows) => déterminerTypologieDuGroupementParMinistère(leafRows.map(row => row.original)),
    aggregatedCell: estBarometre => estBarometre.getValue() ? <PictoBaromètre taille={{ mesure: 1.25, unité: 'rem' }} /> : null,
  }),
  reactTableColonnesHelper.accessor('météo', {
    header: 'Météo',
    cell: météo => <TableauChantiersMétéo météo={météo.getValue()} />,
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => comparerMétéo(a.getValue(columnId), b.getValue(columnId)),
    enableGrouping: false,
  }),
  reactTableColonnesHelper.accessor('avancement', {
    header: 'Avancement',
    cell: avancement => <TableauChantiersAvancement avancement={avancement.getValue()} />,
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => comparerAvancementChantier(a.getValue(columnId), b.getValue(columnId)),
    enableGrouping: false,
    aggregationFn: 'mean',
    aggregatedCell: avancement => <TableauChantiersAvancement avancement={avancement.getValue() ?? null} />,
  }),
];

export default function useTableauChantiers(données: TableauChantiersProps['données']) {
  const [valeurDeLaRecherche, setValeurDeLaRecherche] = useState('');
  const [tri, setTri] = useState<SortingState>([]);
  const [regroupement, setRegroupement] = useState<GroupingState>([]);

  const tableau = useReactTable({
    data: données,
    columns: colonnesTableauChantiers,
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
