import type {
  Header as TanstackHeader,
  HeaderGroup,
} from "@tanstack/react-table";
import { Table } from "@/components/shared/Table";
import { clsxm } from "@/utils/clsxm";
import {
  getColumnLabel,
  getColumnMeta,
  hasFeature,
  toAriaSort,
} from "./features";
import { ColumnSortButton } from "./ColumnSortButton";
import type { AnyTable } from "./types";

export type DataTableHeaderProps = {
  className?: string;
  cellClassName?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHeader = TanstackHeader<any, any, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHeaderGroup = HeaderGroup<any, any>;

function DataTableColumnHeader({
  table,
  header,
  cellClassName,
}: {
  table: AnyTable;
  header: AnyHeader;
  cellClassName?: string;
}) {
  const column = header.column;
  const meta = getColumnMeta(column);
  const label = getColumnLabel(column);
  const sortable =
    hasFeature(table, "rowSortingFeature") && column.getCanSort();
  const sorted = sortable ? column.getIsSorted() : false;

  return (
    <Table.ColumnHeaderCell
      aria-sort={sorted ? toAriaSort(sorted) : undefined}
      className={clsxm(cellClassName, meta?.headerClassName)}
      colSpan={header.colSpan > 1 ? header.colSpan : undefined}
      style={meta?.width ? { width: meta.width } : undefined}
    >
      {header.isPlaceholder ? (
        <span className="sr-only">{label}</span>
      ) : sortable && meta?.sortButton !== false ? (
        <ColumnSortButton column={column}>
          <table.FlexRender header={header} />
        </ColumnSortButton>
      ) : (
        <table.FlexRender header={header} />
      )}
    </Table.ColumnHeaderCell>
  );
}

export function DataTableHeader({
  table,
  className,
  cellClassName,
}: DataTableHeaderProps & { table: AnyTable }) {
  return (
    <Table.Header className={className}>
      {table.getHeaderGroups().map((headerGroup: AnyHeaderGroup) => (
        <Table.Row key={headerGroup.id}>
          {headerGroup.headers.map((header: AnyHeader) => (
            <DataTableColumnHeader
              cellClassName={cellClassName}
              header={header}
              key={header.id}
              table={table}
            />
          ))}
        </Table.Row>
      ))}
    </Table.Header>
  );
}
