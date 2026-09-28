import {
  columnVisibilityFeature,
  createTableHook,
  metaHelper,
  tableFeatures,
  type AppReactTable,
  type CreateTableHookOptions,
  type Row,
  type RowData,
  type TableFeatures,
  type TableOptions,
  type TableState,
} from "@tanstack/react-table";
import { type ReactNode, useMemo, useRef, useState } from "react";
import { DataTableBody, type DataTableBodyProps } from "./Body";
import { type DataTableConfig, getDataTableConfig } from "./config";
import { hasFeature } from "./features";
import { DataTableFilters, type DataTableFiltersProps } from "./Filters";
import { createSearchFilterFn } from "./filterFns";
import { DataTableHeader, type DataTableHeaderProps } from "./Header";
import {
  DataTablePagination,
  type DataTablePaginationProps,
} from "./Pagination";
import { DataTableRoot, type DataTableRootProps } from "./Root";
import type { PointDeRuptureÉcran } from "@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore.interface";
import type { AnyTable, DataTableColumnMeta } from "./types";
import { type UrlStateConfig, useUrlTableState } from "./urlState";

const dataTableBaseFeatures = tableFeatures({
  columnVisibilityFeature,
  columnMeta: metaHelper<DataTableColumnMeta>(),
});

export type AppFeatures<F extends TableFeatures> = F &
  typeof dataTableBaseFeatures;

type NoComponents = Record<never, never>;

export type DataTableOptions<
  F extends TableFeatures,
  TData extends RowData,
> = Omit<TableOptions<AppFeatures<F>, TData>, "features"> & {
  rowHeader?: string;
  getRowHref?: (row: Row<AppFeatures<F>, TData>) => string | undefined;
  tile?: (row: Row<AppFeatures<F>, TData>) => ReactNode;
  tileBreakpoint?: PointDeRuptureÉcran;
  tileLabel?: (row: Row<AppFeatures<F>, TData>) => string;
  search?: (row: TData) => string[];
  urlState?: UrlStateConfig;
};

type DataTableBricks = {
  Root: (props: DataTableRootProps) => ReactNode;
  Header: (props: DataTableHeaderProps) => ReactNode;
  Body: (props: DataTableBodyProps) => ReactNode;
  hasActiveFilters: () => boolean;
  resetFilters: () => void;
};

type FiltersBricks<F> = F extends { columnFilteringFeature: unknown }
  ? { Filters: (props: DataTableFiltersProps) => ReactNode }
  : F extends { globalFilteringFeature: unknown }
    ? { Filters: (props: DataTableFiltersProps) => ReactNode }
    : NoComponents;

type PaginationBricks<F> = F extends { rowPaginationFeature: unknown }
  ? { Pagination: (props: DataTablePaginationProps) => ReactNode }
  : NoComponents;

export type DataTable<
  F extends TableFeatures,
  TData extends RowData,
> = AppReactTable<
  F,
  TData,
  TableState<F>,
  NoComponents,
  NoComponents,
  NoComponents
> &
  DataTableBricks &
  PaginationBricks<F> &
  FiltersBricks<F>;

const bindBricks = (getTable: () => AnyTable) => {
  const bricks: DataTableBricks = {
    Root: (props) => (
      <DataTableRoot
        hasActiveFilters={bricks.hasActiveFilters()}
        onResetFilters={bricks.resetFilters}
        table={getTable()}
        {...props}
      />
    ),
    Header: (props) => <DataTableHeader table={getTable()} {...props} />,
    Body: (props) => <DataTableBody table={getTable()} {...props} />,
    hasActiveFilters: () => {
      const urlFilters = getDataTableConfig(getTable()).urlFilters;
      if (urlFilters) return urlFilters.hasActiveFilters;
      const state = getTable().store.state;
      return (
        (state.columnFilters?.length ?? 0) > 0 ||
        Boolean(state.globalFilter?.trim?.())
      );
    },
    resetFilters: () => {
      const table = getTable();
      const urlFilters = getDataTableConfig(table).urlFilters;
      if (urlFilters) return urlFilters.resetFilters();
      if (hasFeature(table, "columnFilteringFeature")) {
        table.resetColumnFilters(true);
      }
      if (hasFeature(table, "globalFilteringFeature")) {
        table.resetGlobalFilter(true);
      }
    },
  };
  return {
    ...bricks,
    ...(hasFeature(getTable(), "rowPaginationFeature")
      ? {
          Pagination: (props: DataTablePaginationProps) => (
            <DataTablePagination table={getTable()} {...props} />
          ),
        }
      : {}),
    ...(hasFeature(getTable(), "columnFilteringFeature") ||
    hasFeature(getTable(), "globalFilteringFeature")
      ? {
          Filters: (props: DataTableFiltersProps) => (
            <DataTableFilters
              hasActiveFilters={bricks.hasActiveFilters()}
              onResetFilters={bricks.resetFilters}
              table={getTable()}
              {...props}
            />
          ),
        }
      : {}),
  };
};

export function createDataTableHook<F extends TableFeatures>(features: F) {
  type Features = AppFeatures<F>;

  const hook = createTableHook({
    features: { ...features, ...dataTableBaseFeatures },
    defaultColumn: { enableSorting: false },
  } as unknown as CreateTableHookOptions<
    Features,
    NoComponents,
    NoComponents,
    NoComponents
  >);

  function useDataTable<TData extends RowData>({
    rowHeader,
    getRowHref,
    tile,
    tileBreakpoint,
    tileLabel,
    search,
    urlState,
    ...tableOptions
  }: DataTableOptions<F, TData>): DataTable<Features, TData> {
    const dataTable: DataTableConfig = {
      rowHeader,
      getRowHref: getRowHref as DataTableConfig["getRowHref"],
      tile: tile as DataTableConfig["tile"],
      tileBreakpoint,
      tileLabel: tileLabel as DataTableConfig["tileLabel"],
    };
    const url = useUrlTableState(urlState);
    const table = hook.useAppTable<TData>({
      ...(urlState?.pagination ? { autoResetPageIndex: false } : {}),
      ...tableOptions,
      ...url.handlers,
      state: { ...url.state, ...tableOptions.state },
      ...(search ? { globalFilterFn: createSearchFilterFn(search) } : {}),
      meta: {
        ...tableOptions.meta,
        dataTable: {
          ...dataTable,
          ...(urlState
            ? {
                urlFilters: {
                  hasActiveFilters: url.hasActiveFilters,
                  resetFilters: url.resetFilters,
                },
              }
            : {}),
        },
      },
    } as never);

    const tableRef = useRef(table as unknown as AnyTable);
    tableRef.current = table as unknown as AnyTable;
    const [bricks] = useState(() => bindBricks(() => tableRef.current));

    return useMemo(
      () =>
        Object.assign(table, bricks) as unknown as DataTable<Features, TData>,
      [table, bricks],
    );
  }

  return {
    useDataTable,
    createColumnHelper: hook.createAppColumnHelper,
    features: hook.appFeatures,
  };
}
