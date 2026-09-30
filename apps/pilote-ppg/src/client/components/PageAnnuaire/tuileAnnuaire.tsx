import { flexRender, type Row, type RowData } from "@tanstack/react-table";
import type { AppFeatures } from "@/components/shared/DataTable/createDataTableHook";
import type { featuresAnnuaire } from "./featuresAnnuaire";

// Vue mobile : les cellules visibles de la ligne de groupe, empilées.
export const tuileAnnuaire = <TData extends RowData>(
  row: Row<AppFeatures<typeof featuresAnnuaire>, TData>,
) => (
  <div className="flex flex-col gap-2 p-4">
    {row.getVisibleCells().map((cell) => (
      <div key={cell.id}>
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </div>
    ))}
  </div>
);
