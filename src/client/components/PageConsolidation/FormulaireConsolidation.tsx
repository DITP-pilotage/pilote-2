import { flexRender } from "@tanstack/react-table";
import { pageConsolidation } from "@/components/PageConsolidation/PageConsolidationServerSideContext";
import { clsxm } from "@/utils/clsxm";
import { useTableauConsolidation } from "./useTableauConsolidation";

export const FormulaireConsolidation = () => {
  const { rattachements } = pageConsolidation.useServerSidePropsContext();
  const { table } = useTableauConsolidation(rattachements);

  return (
    <table className="table-auto w-full border-collapse border border-gray-300">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr className="bg-gray-100" key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                className="border border-gray-300 px-4 py-3 text-left font-semibold"
                key={header.id}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            className={clsxm({
              "bg-gray-50": row.original.type === "critere",
            })}
            key={row.id}
          >
            {row.getVisibleCells().map((cell) => (
              <td className="border border-gray-300 px-4 py-2" key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
