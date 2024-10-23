import {
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  GroupingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChangeEvent, useCallback, useState } from 'react';
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from 'nuqs';
import { comparerMétéo } from '@/client/utils/chantier/météo/météo';
import { comparerAvancementRéforme } from '@/client/utils/chantier/avancement/avancement';
import TableauRéformesAvancement from '@/components/PageAccueil/TableauRéformes/Avancement/TableauRéformesAvancement';
import TableauRéformesMétéo from '@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo';
import { calculerMoyenne } from '@/client/utils/statistiques/statistiques';
import { estLargeurDÉcranActuelleMoinsLargeQue } from '@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore';
import TypologiesPictos
  from '@/components/PageAccueil/PageChantiers/TableauChantiers/TypologiesPictos/TypologiesPictos';
import IcônesMultiplesEtTexte from '@/components/_commons/IcônesMultiplesEtTexte/IcônesMultiplesEtTexte';
import TableauChantiersTendance
  from '@/components/PageAccueil/PageChantiers/TableauChantiers/Tendance/TableauChantiersTendance';
import TableauChantiersÉcart from '@/components/PageAccueil/PageChantiers/TableauChantiers/Écart/TableauChantiersÉcart';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import { comparerDateDeMàjDonnées } from '@/client/utils/date/date';
import { comparerTendance } from '@/client/utils/chantier/tendance/tendance';
import TableauChantiersProps, { DonnéesTableauChantiers } from './TableauChantiers.interface';
import TableauChantiersTuileChantier from './Tuile/Chantier/TableauChantiersTuileChantier';
import TableauChantiersTuileMinistère from './Tuile/Ministère/TableauChantiersTuileMinistère';
import TableauChantiersTuileMinistèreProps from './Tuile/Ministère/TableauChantiersTuileMinistère.interface';


export const useTableauChantiers = (données: TableauChantiersProps['données'], ministèresDisponibles: Ministère[], nombreTotalChantiersAvecAlertes: number) => {

  const [valeurDeLaRecherche, setValeurDeLaRecherche] = useQueryState('q', parseAsString.withDefault('').withOptions({
    shallow: false,
    clearOnDefault: true,
    history: 'push',
    throttleMs: 400,
  }));

  const [pagination, setPagination] = useQueryStates({
    pageIndex: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(50),
  }, {
    history: 'push',
    shallow: false,
  });

  const [estGroupe] = useQueryState('groupeParMinistere', parseAsBoolean.withDefault(false));

  const [regroupement, setRegroupement] = useState<GroupingState>(ministèresDisponibles.length > 1 && estGroupe ? ['porteur'] : []);
  const estVueTuile = estLargeurDÉcranActuelleMoinsLargeQue('md');

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
          texteAlternatifPourIcônes={aggregatedCellContext.row.original.porteur?.nom ?? undefined}
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
            texteAlternatifPourIcônes={cellContext.row.original.porteur?.nom ?? undefined}
          >
            {cellContext.getValue()}
          </IcônesMultiplesEtTexte>
        )
      ),
      enableSorting: false,
      enableGrouping: false,
      meta: {
        width: '20rem',
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
        tabIndex: -1,
      },
    }),
    reactTableColonnesHelper.accessor('météo', {
      header: 'Météo',
      id: 'météo',
      cell: cellContext => (
        <TableauRéformesMétéo
          dateDeMàjDonnéesQualitatives={cellContext.row.original.dateDeMàjDonnéesQualitatives}
          météo={cellContext.getValue()}
        />
      ),
      enableGlobalFilter: false,
      enableGrouping: false,
      meta: {
        width: '8rem',
        tabIndex: -1,
      },
    }),
    reactTableColonnesHelper.accessor('dateDeMàjDonnéesQualitatives', {
      id: 'dateDeMàjDonnéesQualitatives',
      cell: cellContext => cellContext.getValue(),
      enableGrouping: false,
    }),
    reactTableColonnesHelper.accessor('avancement', {
      header: 'Avancement 2026',
      id: 'avancement',
      cell: cellContext => (
        <TableauRéformesAvancement
          avancement={cellContext.getValue()}
          dateDeMàjDonnéesQuantitatives={cellContext.row.original.dateDeMàjDonnéesQuantitatives}
        />
      ),
      enableGlobalFilter: false,
      sortingFn: (a, b, columnId) => comparerAvancementRéforme(a.getValue(columnId), b.getValue(columnId), tri),
      enableGrouping: false,
      aggregationFn: (_columnId, chantiersDuMinistèreRow) => {
        return calculerMoyenne(chantiersDuMinistèreRow.map(chantierRow => chantierRow.original.avancement));
      },
      aggregatedCell: avancement => <TableauRéformesAvancement avancement={avancement.getValue() ?? null} />,
      meta: {
        width: '8rem',
        tabIndex: -1,
      },
    }),
    reactTableColonnesHelper.accessor('dateDeMàjDonnéesQuantitatives', {
      id: 'dateDeMàjDonnéesQuantitatives',
      cell: cellContext => cellContext.getValue(),
      enableGrouping: false,
    }),
    ...(process.env.NEXT_PUBLIC_FF_ALERTES === 'true' && process.env.NEXT_PUBLIC_FF_ALERTES_BAISSE === 'true' ? [
      reactTableColonnesHelper.accessor('tendance', {
        header: 'Tendance',
        id: 'tendance',
        cell: cellContext => (
          <TableauChantiersTendance tendance={cellContext.getValue()} />
        ),
        enableGrouping: false,
        meta: {
          width: '7.5rem',
          tabIndex: -1,
        },
      }),
      reactTableColonnesHelper.accessor('écart', {
        header: 'Écart',
        id: 'écart',
        cell: cellContext => (
          <TableauChantiersÉcart écart={cellContext.getValue()} />
        ),
        enableGrouping: false,
        aggregatedCell: () => null,
        meta: {
          width: '4.5rem',
          tabIndex: -1,
        },
      }),
    ] : []),
    reactTableColonnesHelper.display({
      id: 'dérouler-groupe',
      aggregatedCell: (aggregatedCellContext => (
        <button
          className={`${aggregatedCellContext.row.getIsExpanded() ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'} chevron-accordéon`}
          type='button'
        />
      )),
      meta: {
        width: '3.5rem',
        tabIndex: -1,
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

  const tableau = useReactTable({
    data: données,
    columns: colonnesTableauChantiers,
    state: {
      pagination,
      grouping: regroupement,
      columnVisibility: estVueTuile ? ({
        porteur: false,
        nom: false,
        météo: false,
        dateDeMàjDonnéesQualitatives: false,
        avancement: false,
        dateDeMàjDonnéesQuantitatives: false,
        typologie: false,
        tendance: false,
        écart: false,
        'dérouler-groupe': false,
      }) : ({
        porteur: false,
        'chantier-tuile': false,
        dateDeMàjDonnéesQualitatives: false,
        dateDeMàjDonnéesQuantitatives: false,
      }),
    },
    manualPagination: true,
    onPaginationChange: setPagination,
    pageCount: nombreTotalChantiersAvecAlertes % pagination.pageSize === 0 ? Math.trunc(nombreTotalChantiersAvecAlertes / pagination.pageSize) : Math.trunc(nombreTotalChantiersAvecAlertes / pagination.pageSize) + 1,
    onGroupingChange: setRegroupement,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const changementDeLaRechercheCallback = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPagination({
      pageIndex: 1,
    });
    setValeurDeLaRecherche(event.target.value);
  }, [setPagination, setValeurDeLaRecherche]);

  return {
    tableau,
    changementDeLaRechercheCallback,
    valeurDeLaRecherche,
    estVueTuile,
  };
};
