import {
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  type Table,
} from "@tanstack/react-table";

/**
 * En v9 le type `Table` est paramétré par son jeu de features, et une API n'existe que
 * si sa feature est enregistrée. Les composants de présentation partagés sont branchés
 * sur des tables aux jeux différents — trois options se présentent, dont deux ne
 * marchent pas, et ça vaut la peine de dire pourquoi.
 *
 * `Table<any, T>` n'est PAS l'échappatoire : `ExtractFeatureMapTypes` traite `any` par
 * `UnionToIntersection` de toutes les features, si bien que `Table<any, T>` exige
 * l'intersection des seize. Une table construite avec un sous-ensemble a moins de
 * membres et n'est pas assignable. `StockFeatures` et `TableFeatures` échouent pareil.
 *
 * Paramétrer les composants sur `TFeatures` ne marche pas non plus dès qu'ils APPELLENT
 * une API : tant que le générique n'est pas résolu, `ExtractFeatureMapTypes` rend une
 * union que TypeScript ne réduit pas, et `getIsSorted` n'existe sur aucune branche.
 *
 * Reste un jeu concret MINIMAL — celui que l'arbre partagé appelle réellement : tri,
 * pagination, visibilité des colonnes. Le typage structurel fait le reste : un appelant
 * dont le jeu est un sur-ensemble possède tous ces membres et passe sans cast.
 * Pour aller plus loin, la solution amont est `createTableHook()` — son propre ticket.
 */
export const featuresTableauPartage = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LigneTableau = Record<string, any>;

export type TableauDe<T extends LigneTableau> = Table<
  typeof featuresTableauPartage,
  T
>;
