import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  throttle,
  useQueryStates,
} from "nuqs";
import { useMemo } from "react";
import { parseAsSorting, parseAsTablePage } from "./urlParsers";

export type UrlStateConfig = {
  sorting?: { default?: SortingState };
  pagination?: { pageSize?: number };
  globalFilter?: boolean;
  columnFilters?: Array<{
    param: string;
    columnId: string;
    default?: string[];
  }>;
  shallow?: boolean;
  history?: "push" | "replace";
  throttleMs?: number;
};

const resolve = <T>(updater: Updater<T>, previous: T): T =>
  typeof updater === "function"
    ? (updater as (previous: T) => T)(previous)
    : updater;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const sameValues = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value) => right.includes(value));

type Query = Record<string, unknown>;

export type UrlTableState = {
  state: {
    sorting?: SortingState;
    pagination?: PaginationState;
    globalFilter?: string;
    columnFilters?: ColumnFiltersState;
  };
  handlers: {
    onSortingChange?: OnChangeFn<SortingState>;
    onPaginationChange?: OnChangeFn<PaginationState>;
    onGlobalFilterChange?: OnChangeFn<string>;
    onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  };
  hasActiveFilters: boolean;
  resetFilters: () => void;
};

export function useUrlTableState(config?: UrlStateConfig): UrlTableState {
  const configKey = JSON.stringify(config ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableConfig = useMemo(() => config, [configKey]);
  const filters = stableConfig?.columnFilters ?? [];

  const parsers = useMemo(
    () => ({
      ...(stableConfig?.sorting
        ? {
            sort: parseAsSorting.withDefault(
              stableConfig.sorting.default ?? [],
            ),
          }
        : {}),
      ...(stableConfig?.pagination
        ? {
            page: parseAsTablePage,
            pageSize: parseAsInteger.withDefault(
              stableConfig.pagination.pageSize ?? 10,
            ),
          }
        : {}),
      ...(stableConfig?.globalFilter
        ? { q: parseAsString.withDefault("") }
        : {}),
      ...Object.fromEntries(
        (stableConfig?.columnFilters ?? []).map((filter) => [
          filter.param,
          parseAsArrayOf(parseAsString).withDefault(filter.default ?? []),
        ]),
      ),
    }),
    [stableConfig],
  );

  const [query, setQuery] = useQueryStates(parsers, {
    clearOnDefault: true,
    shallow: stableConfig?.shallow ?? true,
    history: stableConfig?.history ?? "replace",
    ...(stableConfig?.throttleMs
      ? { limitUrlUpdates: throttle(stableConfig.throttleMs) }
      : {}),
  });
  const values = query as Query;
  const update = setQuery as unknown as (
    updater: (previous: Query) => Query | null,
  ) => Promise<URLSearchParams>;

  const toColumnFilters = (source: Query): ColumnFiltersState =>
    filters
      .filter((filter) => toStringArray(source[filter.param]).length > 0)
      .map((filter) => ({
        id: filter.columnId,
        value: toStringArray(source[filter.param]),
      }));

  const firstPage = stableConfig?.pagination ? { page: null } : {};

  if (stableConfig == null) {
    return {
      state: {},
      handlers: {},
      hasActiveFilters: false,
      resetFilters: () => {},
    };
  }

  const state = {
    ...(stableConfig.sorting ? { sorting: values.sort as SortingState } : {}),
    ...(stableConfig.pagination
      ? {
          pagination: {
            pageIndex: values.page as number,
            pageSize: values.pageSize as number,
          },
        }
      : {}),
    ...(stableConfig.globalFilter ? { globalFilter: values.q as string } : {}),
    ...(filters.length > 0 ? { columnFilters: toColumnFilters(values) } : {}),
  };

  const onSortingChange: OnChangeFn<SortingState> = (updater) =>
    void update((previous) => {
      const next = resolve(updater, previous.sort as SortingState);
      return { sort: next.length > 0 ? next : null };
    });

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) =>
    void update((previous) => {
      const next = resolve(updater, {
        pageIndex: previous.page as number,
        pageSize: previous.pageSize as number,
      });
      return { page: next.pageIndex, pageSize: next.pageSize };
    });

  const onGlobalFilterChange: OnChangeFn<string> = (updater) =>
    void update((previous) => ({
      q: resolve(updater, previous.q as string) ?? "",
      ...firstPage,
    }));

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) =>
    void update((previous) => {
      const next = resolve(updater, toColumnFilters(previous));
      return {
        ...Object.fromEntries(
          filters.map((filter) => [
            filter.param,
            toStringArray(
              next.find((columnFilter) => columnFilter.id === filter.columnId)
                ?.value,
            ),
          ]),
        ),
        ...firstPage,
      };
    });

  const hasActiveFilters =
    filters.some(
      (filter) =>
        !sameValues(toStringArray(values[filter.param]), filter.default ?? []),
    ) ||
    (stableConfig.globalFilter === true && (values.q as string).trim() !== "");

  const resetFilters = () =>
    void update(() => ({
      ...Object.fromEntries(filters.map((filter) => [filter.param, null])),
      ...(stableConfig.globalFilter ? { q: null } : {}),
      ...firstPage,
    }));

  return {
    state,
    handlers: {
      ...(stableConfig.sorting ? { onSortingChange } : {}),
      ...(stableConfig.pagination ? { onPaginationChange } : {}),
      ...(stableConfig.globalFilter ? { onGlobalFilterChange } : {}),
      ...(filters.length > 0 ? { onColumnFiltersChange } : {}),
    },
    hasActiveFilters,
    resetFilters,
  };
}
