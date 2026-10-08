import Link from "next/link";
import type { ReactNode } from "react";
import { type Cell, flexRender } from "@tanstack/react-table";
import { Table } from "@/components/shared/Table";
import { clsxm } from "@/utils/clsxm";
import { type AnyRow, getDataTableConfig } from "./config";
import { getColumnMeta, hasFeature } from "./features";
import type { AnyTable } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyCell = Cell<any, any, any>;

export type DataTableBodyProps = {
  className?: string;
  cellClassName?: string;
  cellTitle?: boolean;
  rowClassName?: string | ((row: AnyRow) => string | undefined);
  renderGroupCell?: (cell: AnyCell) => ReactNode;
};

const ROW_LINK_FOCUS =
  "[&:has(>th>a:focus-visible)]:outline-2 [&:has(>th>a:focus-visible)]:-outline-offset-2 [&:has(>th>a:focus-visible)]:outline-dsfr-focus";

const ABOVE_ROW_LINK =
  "[&_:is(a,button,input,select,textarea)]:relative [&_:is(a,button,input,select,textarea)]:z-10";

function renderCellContent(
  cell: AnyCell,
  isGroupRow: boolean,
  canExpand: boolean,
  renderGroupCell: DataTableBodyProps["renderGroupCell"],
) {
  const row = cell.row;
  if (isGroupRow && canExpand && cell.getIsGrouped()) {
    return (
      <button
        aria-expanded={row.getIsExpanded()}
        className="inline-flex items-center gap-2 text-left"
        onClick={row.getToggleExpandedHandler()}
        type="button"
      >
        {renderGroupCell
          ? renderGroupCell(cell)
          : flexRender(cell.column.columnDef.cell, cell.getContext())}
      </button>
    );
  }
  const template = isGroupRow
    ? (cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell)
    : cell.column.columnDef.cell;
  return flexRender(template, cell.getContext());
}

function DataTableRow({
  table,
  row,
  rowClassName,
  cellClassName,
  cellTitle,
  renderGroupCell,
}: {
  table: AnyTable;
  row: AnyRow;
  rowClassName?: DataTableBodyProps["rowClassName"];
  cellClassName?: string;
  cellTitle?: boolean;
  renderGroupCell?: DataTableBodyProps["renderGroupCell"];
}) {
  const { rowHeader, getRowHref } = getDataTableConfig(table);
  const isGroupRow =
    hasFeature(table, "columnGroupingFeature") && row.getIsGrouped();
  const canExpand = hasFeature(table, "rowExpandingFeature");
  const href = isGroupRow ? undefined : getRowHref?.(row);

  return (
    <Table.Row
      className={clsxm(
        href && ["relative", ROW_LINK_FOCUS],
        typeof rowClassName === "function" ? rowClassName(row) : rowClassName,
      )}
    >
      {row.getVisibleCells().map((cell: AnyCell) => {
        const meta = getColumnMeta(cell.column);
        const content = renderCellContent(
          cell,
          isGroupRow,
          canExpand,
          renderGroupCell,
        );
        const value = cellTitle ? cell.getValue() : undefined;
        const title =
          typeof value === "string" || typeof value === "number"
            ? String(value)
            : undefined;

        if (cell.column.id === rowHeader) {
          return (
            <Table.RowHeaderCell
              className={clsxm(cellClassName, meta?.cellClassName)}
              key={cell.id}
              title={title}
            >
              {href ? (
                <Link
                  className="bg-none after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                  href={href}
                >
                  {content}
                </Link>
              ) : (
                content
              )}
            </Table.RowHeaderCell>
          );
        }
        return (
          <Table.Cell
            className={clsxm(
              cellClassName,
              href && ABOVE_ROW_LINK,
              meta?.cellClassName,
            )}
            key={cell.id}
            title={title}
          >
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
  cellClassName,
  cellTitle,
  rowClassName,
  renderGroupCell,
}: DataTableBodyProps & { table: AnyTable }) {
  return (
    <Table.Body className={clsxm(className)}>
      {table.getRowModel().rows.map((row: AnyRow) => (
        <DataTableRow
          cellClassName={cellClassName}
          cellTitle={cellTitle}
          key={row.id}
          renderGroupCell={renderGroupCell}
          row={row}
          rowClassName={rowClassName}
          table={table}
        />
      ))}
    </Table.Body>
  );
}
