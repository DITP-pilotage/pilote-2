import type { ReactNode } from "react";
import { Table, type TableRootProps } from "@/components/shared/Table";
import type { AnyTable, EmptyConfig } from "./types";

export type DataTableRootProps = Omit<TableRootProps, "children"> & {
  empty?: EmptyConfig;
  children: ReactNode;
};

export function DataTableRoot({
  table,
  empty: _empty,
  children,
  ...props
}: DataTableRootProps & { table: AnyTable }) {
  return (
    <table.AppTable>
      <Table.Root {...props}>{children}</Table.Root>
    </table.AppTable>
  );
}
