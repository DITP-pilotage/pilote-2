import { useMemo, useState } from "react";
import {
  aggregationFn_max,
  columnFilteringFeature,
  columnGroupingFeature,
  createColumnHelper,
  createFilteredRowModel,
  createGroupedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrIncludes,
  filterFn_arrHas,
  globalFilteringFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_basic,
  tableFeatures,
  useTable,
  type ExpandedState,
  type GroupingState,
  type PaginationState,
  type SortingState,
  type Row,
} from "@tanstack/react-table";
import { type $Enums } from "@prisma/client";
import type { IndicateurNonAJour } from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";

export const featuresIndicateursNonAJour = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  columnGroupingFeature,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  groupedRowModel: createGroupedRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

export const TAILLES_DE_PAGE_CHANTIERS = [1, 3, 5, 10];
const TAILLE_DE_PAGE_CHANTIERS_PAR_DEFAUT = 3;

// Références stables : un nouveau tableau à chaque rendu fait recalculer les
// row models groupé et trié, qui remettent alors la page courante à 0.
const REGROUPEMENT_PAR_CHANTIER: GroupingState = ["chantier"];
const TRI_PAR_RETARD_DECROISSANT: SortingState = [{ id: "retard", desc: true }];

export type LigneIndicateurNonAJour = Row<
  typeof featuresIndicateursNonAJour,
  IndicateurNonAJour
>;

const normaliser = (texte: string) =>
  texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const columnHelper = createColumnHelper<
  typeof featuresIndicateursNonAJour,
  IndicateurNonAJour
>();

const colonnes = columnHelper.columns([
  columnHelper.accessor("chantierId", {
    id: "chantier",
    filterFn: filterFn_arrHas,
  }),
  columnHelper.accessor("nom", { id: "nom" }),
  columnHelper.accessor("mailles", {
    id: "mailles",
    filterFn: filterFn_arrIncludes,
    enableGlobalFilter: false,
  }),
  columnHelper.accessor(
    (indicateur) => indicateur.retardMaxJours ?? undefined,
    {
      id: "retard",
      aggregationFn: aggregationFn_max,
      sortFn: sortFn_basic,
      sortUndefined: "last",
      enableGlobalFilter: false,
    },
  ),
]);

export const useTableauIndicateursNonAJour = (
  indicateurs: IndicateurNonAJour[],
) => {
  const [recherche, setRecherche] = useState("");
  const [chantiersFiltres, setChantiersFiltres] = useState<string[]>([]);
  const [mailleFiltre, setMailleFiltre] = useState<$Enums.Maille | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: TAILLE_DE_PAGE_CHANTIERS_PAR_DEFAUT,
  });

  const columnFilters = useMemo(
    () => [
      ...(chantiersFiltres.length > 0
        ? [{ id: "chantier", value: chantiersFiltres }]
        : []),
      ...(mailleFiltre ? [{ id: "mailles", value: [mailleFiltre] }] : []),
    ],
    [chantiersFiltres, mailleFiltre],
  );

  const optionsChantiers = useMemo(
    () =>
      [
        ...new Map(
          indicateurs.map((indicateur) => [
            indicateur.chantierId,
            indicateur.chantierNom,
          ]),
        ),
      ]
        .map(([id, nom]) => ({ id, nom }))
        .sort((gauche, droite) => gauche.nom.localeCompare(droite.nom)),
    [indicateurs],
  );

  const tableau = useTable({
    features: featuresIndicateursNonAJour,
    data: indicateurs,
    columns: colonnes,
    getRowId: (indicateur) => indicateur.indicateurId,
    state: {
      globalFilter: recherche,
      columnFilters,
      grouping: REGROUPEMENT_PAR_CHANTIER,
      sorting: TRI_PAR_RETARD_DECROISSANT,
      expanded,
      pagination,
    },
    globalFilterFn: (
      row: LigneIndicateurNonAJour,
      _columnId: string,
      texteRecherche: string,
    ) =>
      normaliser(`${row.original.indicateurId} ${row.original.nom}`).includes(
        normaliser(texteRecherche),
      ),
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,
    getRowCanExpand: (row) => !row.getIsGrouped(),
    autoResetExpanded: false,
  });

  return {
    tableau,
    pagination,
    recherche,
    setRecherche,
    chantiersFiltres,
    setChantiersFiltres,
    mailleFiltre,
    setMailleFiltre,
    optionsChantiers,
  };
};
