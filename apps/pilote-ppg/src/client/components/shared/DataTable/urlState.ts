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
  type SingleParserBuilder,
  throttle,
  useQueryStates,
} from "nuqs";
import { useMemo } from "react";
import {
  parseAsSorting,
  parseAsSortingAmong,
  parseAsTablePage,
} from "./urlParsers";

export type UrlStateConfig = {
  sorting?: { default?: SortingState; labels?: Record<string, string> };
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
  const filters = useMemo(
    () => stableConfig?.columnFilters ?? [],
    [stableConfig],
  );

  const tableParsers = useMemo(() => {
    const sortingLabels = stableConfig?.sorting?.labels;
    const sortParser: SingleParserBuilder<SortingState> = sortingLabels
      ? parseAsSortingAmong(Object.keys(sortingLabels))
      : parseAsSorting;
    return {
      sort: sortParser.withDefault(stableConfig?.sorting?.default ?? []),
      page: parseAsTablePage,
      pageSize: parseAsInteger.withDefault(
        stableConfig?.pagination?.pageSize ?? 10,
      ),
      q: parseAsString.withDefault(""),
    };
  }, [stableConfig]);

  const filterParsers = useMemo(
    () =>
      Object.fromEntries(
        filters.map((filter) => [
          filter.param,
          parseAsArrayOf(parseAsString).withDefault(filter.default ?? []),
        ]),
      ),
    [filters],
  );

  const options = {
    clearOnDefault: true,
    shallow: stableConfig?.shallow ?? true,
    history: stableConfig?.history ?? "replace",
    ...(stableConfig?.throttleMs
      ? { limitUrlUpdates: throttle(stableConfig.throttleMs) }
      : {}),
  };
  const [query, setQuery] = useQueryStates(tableParsers, options);
  const [filterValues, setFilterValues] = useQueryStates(
    filterParsers,
    options,
  );

  const toColumnFilters = (
    source: Record<string, string[]>,
  ): ColumnFiltersState =>
    filters
      .filter((filter) => (source[filter.param] ?? []).length > 0)
      .map((filter) => ({
        id: filter.columnId,
        value: source[filter.param] ?? [],
      }));

  const backToFirstPage = () => {
    if (stableConfig?.pagination) void setQuery({ page: null });
  };

  if (stableConfig == null) {
    return {
      state: {},
      handlers: {},
      hasActiveFilters: false,
      resetFilters: () => {},
    };
  }

  const state = {
    ...(stableConfig.sorting ? { sorting: query.sort } : {}),
    ...(stableConfig.pagination
      ? { pagination: { pageIndex: query.page, pageSize: query.pageSize } }
      : {}),
    ...(stableConfig.globalFilter ? { globalFilter: query.q } : {}),
    ...(filters.length > 0
      ? { columnFilters: toColumnFilters(filterValues) }
      : {}),
  };

  const onSortingChange: OnChangeFn<SortingState> = (updater) =>
    void setQuery((previous) => {
      const next = resolve(updater, previous.sort);
      return { sort: next.length > 0 ? next : null };
    });

  const onPaginationChange: OnChangeFn<PaginationState> = (updater) =>
    void setQuery((previous) => {
      const next = resolve(updater, {
        pageIndex: previous.page,
        pageSize: previous.pageSize,
      });
      return { page: next.pageIndex, pageSize: next.pageSize };
    });

  const onGlobalFilterChange: OnChangeFn<string> = (updater) => {
    void setQuery((previous) => ({ q: resolve(updater, previous.q) ?? "" }));
    backToFirstPage();
  };

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    void setFilterValues((previous) => {
      const next = resolve(updater, toColumnFilters(previous));
      return Object.fromEntries(
        filters.map((filter) => [
          filter.param,
          toStringArray(
            next.find((columnFilter) => columnFilter.id === filter.columnId)
              ?.value,
          ),
        ]),
      );
    });
    backToFirstPage();
  };

  const hasActiveFilters =
    filters.some(
      (filter) =>
        !sameValues(filterValues[filter.param] ?? [], filter.default ?? []),
    ) ||
    (stableConfig.globalFilter === true && query.q.trim() !== "");

  const resetFilters = () => {
    void setFilterValues(null);
    if (stableConfig.globalFilter) void setQuery({ q: null });
    backToFirstPage();
  };

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
