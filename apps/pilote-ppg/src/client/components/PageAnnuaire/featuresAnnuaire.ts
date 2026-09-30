import {
  columnFilteringFeature,
  columnGroupingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createGroupedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import { createDataTableHook } from "@/components/shared/DataTable/createDataTableHook";

/**
 * Regroupement sans dépliage : `getRowModel().rows` ne contient que les lignes de groupe,
 * et chaque colonne de liste parcourt `row.subRows`. Pas de `rowExpandingFeature`, donc
 * pas de bouton de dépliage dans `DataTable/Body` (pas d'accordéon).
 */
export const featuresAnnuaire = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  columnGroupingFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  filteredRowModel: createFilteredRowModel(),
  groupedRowModel: createGroupedRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

export const tableauAnnuaire = createDataTableHook(featuresAnnuaire);
