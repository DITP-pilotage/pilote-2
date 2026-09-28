import { flexRender } from "@tanstack/react-table";
import { Table } from "@/components/shared/Table";
import { clsxm } from "@/utils/clsxm";
import { type AnyRow, getDataTableConfig } from "./config";
import { getColumnMeta } from "./features";
import type { AnyTable } from "./types";

export type DataTableBodyProps = {
  className?: string;
  zebra?: boolean;
  rowClassName?: string | ((row: AnyRow) => string | undefined);
};

function DataTableRow({
  table,
  row,
  rowClassName,
}: {
  table: AnyTable;
  row: AnyRow;
  rowClassName?: DataTableBodyProps["rowClassName"];
}) {
  const { rowHeader } = getDataTableConfig(table);

  return (
    <Table.Row
      className={
        typeof rowClassName === "function" ? rowClassName(row) : rowClassName
      }
    >
      {row.getVisibleCells().map((cell) => {
        const meta = getColumnMeta(cell.column);
        const content = flexRender(
          cell.column.columnDef.cell,
          cell.getContext(),
        );
        return cell.column.id === rowHeader ? (
          <Table.RowHeaderCell className={meta?.cellClassName} key={cell.id}>
            {content}
          </Table.RowHeaderCell>
        ) : (
          <Table.Cell className={meta?.cellClassName} key={cell.id}>
            {content}
          </Table.Cell>
        );
      })}
    </Table.Row>
  );
}

export function DataTableBody({
  table,
  className,
  zebra,
  rowClassName,
}: DataTableBodyProps & { table: AnyTable }) {
  return (
    <Table.Body className={clsxm(className)} zebra={zebra}>
      {table.getRowModel().rows.map((row: AnyRow) => (
        <DataTableRow
          key={row.id}
          row={row}
          rowClassName={rowClassName}
          table={table}
        />
      ))}
    </Table.Body>
  );
}
