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
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import rechercheUnTexteContenuDansUnContenant from '@/client/utils/rechercheUnTexteContenuDansUnContenant';
import { comparerMétéo } from '@/client/utils/chantier/météo/météo';
import { comparerAvancementChantier } from '@/client/utils/chantier/avancement/avancement';
import TableauChantiersAvancement from '@/components/PageChantiers/TableauChantiers/Avancement/TableauChantiersAvancement';
import TableauChantiersMétéo from '@/components/PageChantiers/TableauChantiers/Météo/TableauChantiersMétéo';
import { calculerMoyenne } from '@/client/utils/statistiques/statistiques';
import { DirectionDeTri } from '@/components/_commons/Tableau/EnTête/BoutonsDeTri/BoutonsDeTri.interface';
import { estVueMobileStore } from '@/stores/useEstVueMobileStore/useEstVueMobileStore';
import TypologiesPictos from '@/components/PageChantiers/TableauChantiers/TypologiesPictos/TypologiesPictos';
import TableauChantiersProps, { DonnéesTableauChantiers } from './TableauChantiers.interface';
import TableauChantiersTuileChantier from './Tuile/Chantier/TableauChantiersTuileChantier';
import TableauChantiersTuileMinistère from './Tuile/Ministère/TableauChantiersTuileMinistère';
import TableauChantiersTuileMinistèreProps from './Tuile/Ministère/TableauChantiersTuileMinistère.interface';


const déterminerTypologieDuGroupementParMinistère = (chantiersDuGroupe: DonnéesTableauChantiers[]) => {
  return { 
    estBaromètre: chantiersDuGroupe.some(chantier => chantier.typologie.estBaromètre),
    estTerritorialisé: chantiersDuGroupe.some(chantier => chantier.typologie.estTerritorialisé),
  };
};

const reactTableColonnesHelper = createColumnHelper<DonnéesTableauChantiers>();

const colonnesTableauChantiers = [
  reactTableColonnesHelper.accessor('porteur', {
    header: 'Porteur',
    id: 'porteur',
    cell: porteur => porteur.getValue(),
    enableGrouping: true,
  }),

  reactTableColonnesHelper.accessor('nom', {
    header: 'Chantiers',
    id: 'nom',
    aggregatedCell: aggregatedCellContext => aggregatedCellContext.row.original.porteur,
    enableSorting: false,
    enableGrouping: false,
    meta: {
      width: 'auto',
    },
  }),

  reactTableColonnesHelper.accessor('typologie', {
    header: 'Typologie',
    id: 'typologie',
    enableSorting: false,
    cell: typologie => <TypologiesPictos typologies={typologie.getValue()} />,
    enableGrouping: false,
    aggregationFn: (_columnId, leafRows) => déterminerTypologieDuGroupementParMinistère(leafRows.map(row => row.original)),
    aggregatedCell: typologie => typologie.getValue() ? <TypologiesPictos typologies={typologie.getValue()} /> : null,
    meta: {
      width: '8rem',
    },
  }),

  reactTableColonnesHelper.accessor('météo', {
    header: 'Météo',
    id: 'météo',
    cell: météo => <TableauChantiersMétéo météo={météo.getValue()} />,
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => comparerMétéo(a.getValue(columnId), b.getValue(columnId)),
    enableGrouping: false,
    meta: {
      width: '10rem',
    },
  }),

  reactTableColonnesHelper.accessor('avancement', {
    header: 'Avancement',
    id: 'avancement',
    cell: avancement => <TableauChantiersAvancement avancement={avancement.getValue()} />,
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => comparerAvancementChantier(a.getValue(columnId), b.getValue(columnId)),
    enableGrouping: false,
    aggregationFn: (_columnId, chantiersDuMinistèreRow) => {
      return calculerMoyenne(chantiersDuMinistèreRow.map(chantierRow => chantierRow.original.avancement));
    },
    aggregatedCell: avancement => <TableauChantiersAvancement avancement={avancement.getValue() ?? null} />,
    meta: {
      width: '11rem',
    },
  }),

  reactTableColonnesHelper.display({
    id: 'dérouler-groupe',
    aggregatedCell: (aggregatedCellContext => (
      <span
        aria-hidden="true"
        className={`${aggregatedCellContext.row.getIsExpanded() ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'} chevron-accordéon`}
      />
    )),
    meta: {
      width: '3.5rem',
    },
  }),

  reactTableColonnesHelper.display({
    id: 'chantier-tuile',
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
];

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
  const estVueMobile = estVueMobileStore();

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

  useEffect(() => {
    if (tri[0]) {
      setSélectionColonneÀTrier(tri[0].id);
    }
  }, [tri]);

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
      columnVisibility: estVueMobile ? ({
        porteur: false,
        nom: false,
        météo: false,
        avancement: false,
        typologie: false,
        'dérouler-groupe': false,
      }) : ({
        porteur: false,
        'chantier-tuile': false,
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
