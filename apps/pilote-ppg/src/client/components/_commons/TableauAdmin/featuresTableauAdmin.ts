import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";

/**
 * Jeu de features partagé par les sept pages de référentiels d'administration.
 * L'ordre suit la règle amont : une feature prérequis est déclarée avant le slot
 * de modèle de lignes qui en dépend, et `globalFilteringFeature` exige
 * `columnFilteringFeature`.
 */
export const featuresTableauAdmin = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

export type FeaturesTableauAdmin = typeof featuresTableauAdmin;
