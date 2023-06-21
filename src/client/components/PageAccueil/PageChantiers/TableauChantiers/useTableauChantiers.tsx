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
import { comparerAvancementRéforme } from '@/client/utils/chantier/avancement/avancement';
import TableauRéformesAvancement from '@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement';
import TableauRéformesMétéo from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo';
import { calculerMoyenne } from '@/client/utils/statistiques/statistiques';
import { DirectionDeTri } from '@/components/_commons/Tableau/EnTête/BoutonsDeTri/BoutonsDeTri.interface';
import { estVueMobileStore } from '@/stores/useEstVueMobileStore/useEstVueMobileStore';
import TypologiesPictos
  from '@/components/PageAccueil/PageChantiers/TableauChantiers/TypologiesPictos/TypologiesPictos';
import useTableauRéformes from '@/components/PageAccueil/TableauRéformes/useTableauRéformes';
import IcônesMultiplesEtTexte from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte';
import TableauChantiersTendance from '@/components/PageAccueil/PageChantiers/TableauChantiers/Tendance/TableauChantiersTendance';
import TableauChantiersÉcart from '@/components/PageAccueil/PageChantiers/TableauChantiers/Écart/TableauChantiersÉcart';
import TableauChantiersProps, { DonnéesTableauChantiers } from './TableauChantiers.interface';
import TableauChantiersTuileChantier from './Tuile/Chantier/TableauChantiersTuileChantier';
import TableauChantiersTuileMinistère from './Tuile/Ministère/TableauChantiersTuileMinistère';
import TableauChantiersTuileMinistèreProps from './Tuile/Ministère/TableauChantiersTuileMinistère.interface';

const reactTableColonnesHelper = createColumnHelper<DonnéesTableauChantiers>();

const colonnesTableauChantiers = [
  reactTableColonnesHelper.accessor('porteur.nom', {
    header: 'Porteur',
    id: 'porteur',
    cell: cellContext => cellContext.getValue(),
    enableGrouping: true,
  }),
  reactTableColonnesHelper.accessor('nom', {
    header: 'Chantiers',
    id: 'nom',
    aggregatedCell: aggregatedCellContext => (
      <IcônesMultiplesEtTexte
        icônesId={aggregatedCellContext.row.original.porteur?.icône ? [aggregatedCellContext.row.original.porteur.icône] : []}
      >
        {aggregatedCellContext.row.original.porteur?.nom ?? ''}
      </IcônesMultiplesEtTexte>
    ),
    cell: cellContext => (
      cellContext.table.getColumn('porteur')?.getIsGrouped() ? (
        <IcônesMultiplesEtTexte
          icônesId={[]}
        >
          {cellContext.getValue()}
        </IcônesMultiplesEtTexte>
      ) : (
        <IcônesMultiplesEtTexte
          icônesId={cellContext.row.original.porteur?.icône ? [cellContext.row.original.porteur.icône] : []}
        >
          {cellContext.getValue()}
        </IcônesMultiplesEtTexte>
      )
    ),
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
    cell: cellContext => <TypologiesPictos typologies={cellContext.getValue()} />,
    enableGrouping: false,
    meta: {
      width: '6.5rem',
    },
  }),
  reactTableColonnesHelper.accessor('météo', {
    header: 'Météo',
    id: 'météo',
    cell: cellContext => <TableauRéformesMétéo météo={cellContext.getValue()} />,
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => (
      a.getIsGrouped() || b.getIsGrouped()
        ? 0
        : comparerMétéo(a.getValue(columnId), b.getValue(columnId))
    ),
    enableGrouping: false,
    meta: {
      width: '8rem',
    },
  }),
  reactTableColonnesHelper.accessor('avancement', {
    header: 'Avancement',
    id: 'avancement',
    cell: cellContext => <TableauRéformesAvancement avancement={cellContext.getValue()} />,
    enableGlobalFilter: false,
    sortingFn: (a, b, columnId) => comparerAvancementRéforme(a.getValue(columnId), b.getValue(columnId)),
    enableGrouping: false,
    aggregationFn: (_columnId, chantiersDuMinistèreRow) => {
      return calculerMoyenne(chantiersDuMinistèreRow.map(chantierRow => chantierRow.original.avancement));
    },
    aggregatedCell: avancement => <TableauRéformesAvancement avancement={avancement.getValue() ?? null} />,
    meta: {
      width: '11rem',
    },
  }),
  reactTableColonnesHelper.accessor('tendance', {
    header: 'Tendance',
    id: 'tendance',
    enableSorting: false,
    cell: cellContext => (
      <TableauChantiersTendance tendance={cellContext.getValue()} />
    ),
    enableGrouping: false,
    meta: {
      width: '7.5rem',
    },
  }),
  reactTableColonnesHelper.accessor('écart', {
    header: 'Écart',
    id: 'écart',
    enableSorting: false,
    cell: cellContext => (
      <TableauChantiersÉcart écart={cellContext.getValue()} />
    ),
    enableGrouping: false,
    meta: {
      width: '5.5rem',
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
    cell: chantierCellContext => (
      <TableauChantiersTuileChantier
        afficherIcône={!chantierCellContext.table.getColumn('porteur')?.getIsGrouped()}
        chantier={chantierCellContext.row.original}
      />
    ),
    aggregatedCell: aggregatedCellContext => (
      <TableauChantiersTuileMinistère
        estDéroulé={aggregatedCellContext.row.getIsExpanded()}
        ministère={aggregatedCellContext.getValue() as TableauChantiersTuileMinistèreProps['ministère']}
      />
    ),
    aggregationFn: (_columnId, chantiersDuMinistèreRow) => {
      return {
        nom: chantiersDuMinistèreRow[0].original.porteur?.nom ?? '',
        icône: chantiersDuMinistèreRow[0].original.porteur?.icône ?? null,
        avancement: calculerMoyenne(chantiersDuMinistèreRow.map(chantierRow => chantierRow.original.avancement)),
      } as TableauChantiersTuileMinistèreProps['ministère'];
    },
    enableSorting: false,
    enableGrouping: false,
  }),
];


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
      const texteContenant: unknown = ligne.getValue<DonnéesTableauChantiers>(colonneId);
      if (!texteContenant)
        return false;
      return rechercheUnTexteContenuDansUnContenant(filtreValeur, texteContenant.toString());
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

  const {
    transformerEnDirectionDeTri,
    transformerEnSortingState,
    changementDePageCallback, 
  } = useTableauRéformes(tableau);

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
