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
  type PaginationState,
  type SortingState,
  type Row,
} from "@tanstack/react-table";
import { type $Enums } from "@prisma/client";
import type { IndicateurNonAJour } from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";
import {
  correspondALaRecherche,
  extraireOptionsChantiers,
  REGROUPEMENT_PAR_CHANTIER,
  TAILLE_DE_PAGE_CHANTIERS_PAR_DEFAUT,
} from "./tableauChantiers";

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

// Référence stable, voir REGROUPEMENT_PAR_CHANTIER.
const TRI_PAR_RETARD_DECROISSANT: SortingState = [{ id: "retard", desc: true }];

export type LigneIndicateurNonAJour = Row<
  typeof featuresIndicateursNonAJour,
  IndicateurNonAJour
>;

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
    () => extraireOptionsChantiers(indicateurs),
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
    ) => correspondALaRecherche(row.original, texteRecherche),
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
