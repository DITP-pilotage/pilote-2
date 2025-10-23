import { Table } from "@tanstack/react-table";
import { ButtonTag } from "@/components/_commons/ButtonTag";

export function GroupesInstruction<T>({ table }: { table: Table<T> }) {
  const groupableColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        column.getCanGroup() && column.columnDef.meta?.grouping !== undefined,
    );

  const currentGrouping = table.getState().grouping[0] ?? null;

  if (groupableColumns.length === 0) return null;

  return (
    <div className="flex items-center gap-2 !text-sm">
      <div className="font-semibold">Grouper par :</div>
      <div className="flex items-center flex-wrap gap-2">
        {groupableColumns.map((column) => {
          const isActive = currentGrouping === column.id;
          return (
            <ButtonTag
              isActive={isActive}
              key={column.id}
              onClick={() => table.setGrouping([column.id])}
              type="button"
            >
              {column.columnDef.meta?.grouping?.label}
            </ButtonTag>
          );
        })}
      </div>
    </div>
  );
}
