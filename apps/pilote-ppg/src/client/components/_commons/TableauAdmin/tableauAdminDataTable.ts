import type { RowData } from "@tanstack/react-table";
import {
  type AppFeatures,
  createDataTableHook,
  type DataTable,
} from "@/components/shared/DataTable/createDataTableHook";
import type { UrlStateConfig } from "@/components/shared/DataTable/urlState";
import { featuresTableauAdmin } from "./featuresTableauAdmin";

export const tableauAdmin = createDataTableHook(featuresTableauAdmin);

export const urlStateAdmin = (
  filtres: UrlStateConfig["columnFilters"],
): UrlStateConfig => ({
  sorting: { default: [{ id: "updatedAt", desc: true }] },
  pagination: { pageSize: 10 },
  globalFilter: true,
  columnFilters: filtres,
  shallow: true,
  history: "replace",
});

export type TableAdmin<TRow extends RowData> = DataTable<
  AppFeatures<typeof featuresTableauAdmin>,
  TRow
>;
