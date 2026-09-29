import {
  columnVisibilityFeature,
  createTableHook,
  metaHelper,
  tableFeatures,
  type AppReactTable,
  type CreateTableHookResult,
  type Row,
  type RowData,
  type TableFeatures,
  type TableOptions,
  type TableState,
} from "@tanstack/react-table";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { DataTableBody, type DataTableBodyProps } from "./Body";
import { getDataTableConfig } from "./config";
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

export type DataTableHook<F extends TableFeatures> = {
  useDataTable: <TData extends RowData>(
    options: DataTableOptions<F, TData>,
  ) => DataTable<AppFeatures<F>, TData>;
  createColumnHelper: CreateTableHookResult<
    AppFeatures<F>,
    NoComponents,
    NoComponents,
    NoComponents
  >["createAppColumnHelper"];
  features: AppFeatures<F>;
};

export function createDataTableHook<F extends TableFeatures>(
  features: F,
): DataTableHook<F>;
export function createDataTableHook(
  features: TableFeatures,
): DataTableHook<TableFeatures> {
  const hook = createTableHook<
    AppFeatures<TableFeatures>,
    NoComponents,
    NoComponents,
    NoComponents
  >({
    features: { ...features, ...dataTableBaseFeatures },
    defaultColumn: { enableSorting: false },
  });

  function useDataTable<TData extends RowData>({
    rowHeader,
    getRowHref,
    tile,
    tileBreakpoint,
    tileLabel,
    search,
    urlState,
    ...tableOptions
  }: DataTableOptions<TableFeatures, TData>) {
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
          rowHeader,
          getRowHref,
          tile,
          tileBreakpoint,
          tileLabel,
          sortingLabels: urlState?.sorting?.labels,
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
    });

    const tableRef = useRef<AnyTable>(table);
    tableRef.current = table;
    const [bricks] = useState(() => bindBricks(() => tableRef.current));

    const pageIndex = url.state.pagination?.pageIndex ?? 0;
    const pageCount =
      urlState?.pagination &&
      hasFeature(tableRef.current, "rowPaginationFeature")
        ? tableRef.current.getPageCount()
        : 0;
    useEffect(() => {
      if (pageCount > 0 && pageIndex >= pageCount) {
        tableRef.current.setPageIndex(pageCount - 1);
      }
    }, [pageIndex, pageCount]);

    return useMemo(() => Object.assign(table, bricks), [table, bricks]);
  }

  return {
    useDataTable,
    createColumnHelper: hook.createAppColumnHelper,
    features: hook.appFeatures,
  };
}
