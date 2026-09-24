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
 * Jeu de features partagé par les quatre tableaux d'administration.
 * L'ordre suit la règle amont : une feature prérequis est déclarée avant le slot
 * de modèle de lignes qui en dépend, et `globalFilteringFeature` exige
 * `columnFilteringFeature`.
 *
 * Les composants partagés de ce dossier se typent directement dessus : leurs quatre
 * consommateurs utilisent tous ce même jeu, il n'y a donc aucune raison de les rendre
 * génériques sur les features — et donc aucun `any` à introduire.
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
