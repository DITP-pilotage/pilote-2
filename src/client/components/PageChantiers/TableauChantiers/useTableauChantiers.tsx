import {
  ColumnSort,
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
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import PictoBaromètre from '@/components/_commons/PictoBaromètre/PictoBaromètre';
import { comparerMétéo } from '@/client/utils/chantier/météo/météo';
import { comparerAvancementChantier } from '@/client/utils/chantier/avancement/avancement';
import TableauChantiersAvancement
  from '@/components/PageChantiers/TableauChantiers/Avancement/TableauChantiersAvancement';
import TableauChantiersMétéo from '@/components/PageChantiers/TableauChantiers/Météo/TableauChantiersMétéo';
import useEstVueMobile from '@/hooks/useEstVueMobile';
import { calculerMoyenne } from '@/client/utils/statistiques/statistiques';
import { DirectionDeTri } from '@/components/_commons/Tableau/TableauEnTête/BoutonsDeTri/BoutonsDeTri.interface';
import TableauChantiersProps, { DonnéesTableauChantiers } from './TableauChantiers.interface';
import TableauChantiersTuileChantier from './Tuile/Chantier/TableauChantiersTuileChantier';
import TableauChantiersTuileMinistère from './Tuile/Ministère/TableauChantiersTuileMinistère';
import TableauChantiersTuileMinistèreProps from './Tuile/Ministère/TableauChantiersTuileMinistère.interface';


const déterminerTypologieDuGroupementParMinistère = (chantiersDuGroupe: DonnéesTableauChantiers[]) => {
  return chantiersDuGroupe.some(chantier => chantier.estBaromètre);
};

const reactTableColonnesHelper = createColumnHelper<DonnéesTableauChantiers>();

const colonnesTableauChantiers = {
  vueBureau: [
    reactTableColonnesHelper.accessor('porteur', {
      header: 'Porteur',
      cell: porteur => porteur.getValue(),
      enableGrouping: true,
    }),
    reactTableColonnesHelper.accessor('nom', {
      header: 'Chantiers',
      aggregatedCell: aggregatedCellContext => aggregatedCellContext.row.original.porteur,
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
      aggregationFn: (_columnId, chantiersDuMinistèreRow) => {
        return calculerMoyenne(chantiersDuMinistèreRow.map(chantierRow => chantierRow.original.avancement));
      },
      aggregatedCell: avancement => <TableauChantiersAvancement avancement={avancement.getValue() ?? null} />,
    }),
    reactTableColonnesHelper.display({
      id: 'dérouler-groupe',
      aggregatedCell: (aggregatedCellContext => (
        <span
          aria-hidden="true"
          className={`${aggregatedCellContext.row.getIsExpanded() ? 'fr-icon-arrow-down-s-line' : 'fr-icon-arrow-up-s-line'} chevron-accordéon`}
        />
      )),
    }),
  ],
  vueMobile: [
    reactTableColonnesHelper.accessor('porteur', {
      header: 'Porteur',
      cell: porteur => porteur.getValue(),
      enableGrouping: true,
    }),
    reactTableColonnesHelper.display({
      header: 'Chantiers',
      cell: chantierCellContext => <TableauChantiersTuileChantier chantier={chantierCellContext.row.original} />,
      aggregatedCell: aggregatedCellContext => (
        <TableauChantiersTuileMinistère
          estDéroulé={aggregatedCellContext.row.getIsExpanded()}
          ministère={aggregatedCellContext.getValue() as TableauChantiersTuileMinistèreProps['ministère']}
        />
      ),
      aggregationFn: (_columnId, chantiersDuMinistèreRow) => {
        return {
          nom: chantiersDuMinistèreRow[0].original.porteur,
          avancement: calculerMoyenne(chantiersDuMinistèreRow.map(chantierRow => chantierRow.original.avancement)),
        } as TableauChantiersTuileMinistèreProps['ministère'];
      },
      enableSorting: false,
      enableGrouping: false,
    }),
    reactTableColonnesHelper.accessor('météo', {
      header: 'Météo',
      sortingFn: (a, b, columnId) => comparerMétéo(a.getValue(columnId), b.getValue(columnId)),
    }),
    reactTableColonnesHelper.accessor('avancement', {
      header: 'Avancement',
      sortingFn: (a, b, columnId) => comparerAvancementChantier(a.getValue(columnId), b.getValue(columnId)),
    }),
  ],
};

function transformerEnDirectionDeTri(tri: SortingState): DirectionDeTri {
  if (!tri[0]) {
    return false;
  }
  return (tri[0].desc ? 'desc' : 'asc');
}

function transformerEnSortingState(sélectionColonneÀTrier: string, directionDeTri: DirectionDeTri): SortingState {
  return directionDeTri === false
    ? (
      []
    ) : (
      [{
        id: sélectionColonneÀTrier,
        desc: directionDeTri === 'desc',
      }]
    );
}

export default function useTableauChantiers(données: TableauChantiersProps['données']) {
  const [valeurDeLaRecherche, setValeurDeLaRecherche] = useState('');
  const [tri, setTri] = useState<SortingState>([]);
  const [sélectionColonneÀTrier, setSélectionColonneÀTrier] = useState<string>('avancement');
  const [regroupement, setRegroupement] = useState<GroupingState>([]);
  const estVueMobile = useEstVueMobile();

  useEffect(() => {
    setTri(précédentTri => (
      précédentTri[0] ? [
        {
          id: sélectionColonneÀTrier,
          desc: précédentTri[0].desc,
        },
      ] : []
    ));
  }, [sélectionColonneÀTrier]);

  const tableau = useReactTable({
    data: données,
    columns: estVueMobile ? colonnesTableauChantiers.vueMobile : colonnesTableauChantiers.vueBureau,
    globalFilterFn: (ligne, colonneId, filtreValeur) => {
      return rechercheUnTexteContenuDansUnContenant(filtreValeur, ligne.getValue<DonnéesTableauChantiers>(colonneId).toString());
    },
    state: {
      globalFilter: valeurDeLaRecherche,
      sorting: tri,
      grouping: regroupement,
      columnVisibility: estVueMobile ? ({
        porteur: false,
        météo: false,
        avancement: false,
      }) : ({
        porteur: false,
      }),
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
    sélectionColonneÀTrier,
    changementSélectionColonneÀTrierCallback: setSélectionColonneÀTrier,
    directionDeTri: transformerEnDirectionDeTri(tri),
    changementDirectionDeTriCallback: (directionDeTri: DirectionDeTri) => setTri(transformerEnSortingState(sélectionColonneÀTrier, directionDeTri)),
  };
}
