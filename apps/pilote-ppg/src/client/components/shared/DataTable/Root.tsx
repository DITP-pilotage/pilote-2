import type { ReactNode } from "react";
import { Table, type TableRootProps } from "@/components/shared/Table";
import { estLargeurDÉcranActuelleMoinsLargeQue } from "@/stores/useLargeurDÉcranStore/useLargeurDÉcranStore";
import { type AnyRow, getDataTableConfig } from "./config";
import { DataTableEmpty, isTableEmpty } from "./Empty";
import { DataTableLiveRegion } from "./LiveRegion";
import { DataTableTileList } from "./TileList";
import type { AnyTable, EmptyConfig } from "./types";

export type DataTableRootProps = Omit<TableRootProps, "children"> & {
  empty?: EmptyConfig;
  tileClassName?: (row: AnyRow) => string | undefined;
  children: ReactNode;
};

export function DataTableRoot({
  table,
  empty,
  tileClassName,
  hasActiveFilters,
  onResetFilters,
  children,
  ...props
}: DataTableRootProps & {
  table: AnyTable;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}) {
  const { tile, tileBreakpoint, tileLabel, getRowHref } =
    getDataTableConfig(table);
  const isNarrow = estLargeurDÉcranActuelleMoinsLargeQue(
    tileBreakpoint ?? "sm",
  );

  const content =
    empty != null && isTableEmpty(table) ? (
      <DataTableEmpty
        empty={empty}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={onResetFilters}
      />
    ) : tile != null && isNarrow ? (
      <DataTableTileList
        caption={props.caption}
        getRowHref={getRowHref}
        table={table}
        tile={tile}
        tileClassName={tileClassName}
        tileLabel={tileLabel}
      />
    ) : (
      <Table.Root {...props}>{children}</Table.Root>
    );

  return (
    <table.AppTable>
      {content}
      <DataTableLiveRegion table={table} />
    </table.AppTable>
  );
}
