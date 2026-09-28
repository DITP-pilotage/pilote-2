import type { AnyColumn, AnyTable, DataTableColumnMeta } from "./types";

export type FeatureName =
  | "rowSortingFeature"
  | "rowPaginationFeature"
  | "columnFilteringFeature"
  | "globalFilteringFeature"
  | "columnGroupingFeature"
  | "rowExpandingFeature"
  | "columnFacetingFeature";

export const hasFeature = (table: AnyTable, feature: FeatureName) =>
  feature in table.features;

export const getColumnMeta = (column: AnyColumn) =>
  column.columnDef.meta as DataTableColumnMeta | undefined;

export const getColumnLabel = (column: AnyColumn): string => {
  const header = column.columnDef.header;
  return (
    getColumnMeta(column)?.label ??
    (typeof header === "string" ? header : column.id)
  );
};

export const toAriaSort = (sorted: false | "asc" | "desc") => {
  if (sorted === "asc") return "ascending";
  if (sorted === "desc") return "descending";
  return "none";
};
