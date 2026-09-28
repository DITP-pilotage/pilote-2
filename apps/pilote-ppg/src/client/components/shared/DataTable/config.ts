import type { ReactNode } from "react";
import type { Row } from "@tanstack/react-table";
import type { AnyTable } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRow = Row<any, any>;

export type DataTableConfig = {
  rowHeader?: string;
  getRowHref?: (row: AnyRow) => string | undefined;
  tile?: (row: AnyRow) => ReactNode;
};

export const getDataTableConfig = (table: AnyTable): DataTableConfig =>
  (table.options.meta as { dataTable?: DataTableConfig } | undefined)
    ?.dataTable ?? {};
