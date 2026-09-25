import { useMemo, useState } from "react";
import {
  columnFilteringFeature,
  columnGroupingFeature,
  createColumnHelper,
  createFilteredRowModel,
  createGroupedRowModel,
  createPaginatedRowModel,
  filterFn_arrHas,
  filterFn_arrIncludes,
  globalFilteringFeature,
  rowPaginationFeature,
  tableFeatures,
  useTable,
  type PaginationState,
  type Row,
} from "@tanstack/react-table";
import type {
  IndicateurAParametrer,
  ManqueParametrage,
} from "@/server/suivi-indicateurs/domain/IndicateursAMettreAJour";
import {
  correspondALaRecherche,
  extraireOptionsChantiers,
  REGROUPEMENT_PAR_CHANTIER,
  TAILLE_DE_PAGE_CHANTIERS_PAR_DEFAUT,
} from "./tableauChantiers";

const featuresAParametrer = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  columnGroupingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  groupedRowModel: createGroupedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

export type LigneAParametrer = Row<
  typeof featuresAParametrer,
  IndicateurAParametrer
>;

const columnHelper = createColumnHelper<
  typeof featuresAParametrer,
  IndicateurAParametrer
>();

const colonnes = columnHelper.columns([
  columnHelper.accessor("chantierId", {
    id: "chantier",
    filterFn: filterFn_arrHas,
  }),
  columnHelper.accessor("nom", { id: "nom" }),
  columnHelper.accessor("manques", {
    id: "manques",
    filterFn: filterFn_arrIncludes,
    enableGlobalFilter: false,
  }),
]);

export const useTableauAParametrer = (indicateurs: IndicateurAParametrer[]) => {
  const [recherche, setRecherche] = useState("");
  const [chantiersFiltres, setChantiersFiltres] = useState<string[]>([]);
  const [manqueFiltre, setManqueFiltre] = useState<ManqueParametrage | null>(
    null,
  );
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: TAILLE_DE_PAGE_CHANTIERS_PAR_DEFAUT,
  });

  const columnFilters = useMemo(
    () => [
      ...(chantiersFiltres.length > 0
        ? [{ id: "chantier", value: chantiersFiltres }]
        : []),
      ...(manqueFiltre ? [{ id: "manques", value: [manqueFiltre] }] : []),
    ],
    [chantiersFiltres, manqueFiltre],
  );

  const optionsChantiers = useMemo(
    () => extraireOptionsChantiers(indicateurs),
    [indicateurs],
  );

  const tableau = useTable({
    features: featuresAParametrer,
    data: indicateurs,
    columns: colonnes,
    getRowId: (indicateur) => indicateur.indicateurId,
    state: {
      globalFilter: recherche,
      columnFilters,
      grouping: REGROUPEMENT_PAR_CHANTIER,
      pagination,
    },
    globalFilterFn: (
      row: LigneAParametrer,
      _columnId: string,
      texteRecherche: string,
    ) => correspondALaRecherche(row.original, texteRecherche),
    onPaginationChange: setPagination,
  });

  return {
    tableau,
    pagination,
    recherche,
    setRecherche,
    chantiersFiltres,
    setChantiersFiltres,
    manqueFiltre,
    setManqueFiltre,
    optionsChantiers,
  };
};
