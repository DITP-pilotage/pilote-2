import { flexRender } from "@tanstack/react-table";
import { usePilotageTable } from "@/components/PagePilotage/usePilotageTable";
import { clsxm } from "@/utils/clsxm";

export const TablePilotage = () => {
  const { table, rowSelection } = usePilotageTable();

  const selectedIds = Object.keys(rowSelection);
  const selectedCount = selectedIds.length;

  return (
    <div>
      {selectedCount > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="font-semibold text-blue-900">
            {selectedCount} rattachement{selectedCount > 1 ? "s" : ""}{" "}
            sélectionné
            {selectedCount > 1 ? "s" : ""}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            IDs: {selectedIds.join(", ")}
          </p>
        </div>
      )}
      <div className="overflow-auto border border-gray-200 rounded-lg max-h-[75vh]">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup, groupIndex) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta;

                  return (
                    <th
                      className={clsxm(
                        "border-b border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap",
                        {
                          "shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]":
                            meta?.sticky === "left",
                          "border-l border-gray-200":
                            !meta?.isFirstInGroup && !meta?.sticky,
                          "border-l-2 border-gray-300": meta?.isFirstInGroup,
                        },
                      )}
                      colSpan={header.colSpan}
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        position: "sticky",
                        top: groupIndex * 52,
                        ...(meta?.sticky === "left"
                          ? {
                              left: meta.stickyOffset,
                              zIndex: 30,
                            }
                          : {
                              zIndex: 20,
                            }),
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                key={row.id}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta;

                  return (
                    <td
                      className={clsxm(
                        "px-4 py-3 text-sm text-gray-900 bg-white",
                        {
                          "shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]":
                            meta?.sticky === "left",
                          "border-l-2 border-gray-300": meta?.isFirstInGroup,
                          "border-l border-gray-200":
                            !meta?.isFirstInGroup && !meta?.sticky,
                        },
                      )}
                      key={cell.id}
                      style={{
                        width: cell.column.getSize(),
                        ...(meta?.sticky === "left"
                          ? {
                              position: "sticky",
                              left: meta.stickyOffset,
                            }
                          : {}),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
