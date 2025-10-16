import { flexRender } from "@tanstack/react-table";
import { usePilotageTable } from "@/components/PagePilotage/usePilotageTable";
import { clsxm } from "@/utils/clsxm";
import { LegendeTableauPilotage } from "@/components/PagePilotage/LegendeTableauPilotage";
import { MenuActionTableauPilotage } from "@/components/PagePilotage/MenuActionTableauPilotage";

export const TableauPilotage = () => {
  const { table, fichesSelectionneesIds } = usePilotageTable();

  console.log(table.getHeaderGroups());

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <LegendeTableauPilotage />
        <MenuActionTableauPilotage
          fichesSelectionneesIds={fichesSelectionneesIds}
        />
      </div>

      <div className="overflow-auto border border-gray-200 rounded-lg max-h-[75vh]">
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-1">
            {table.getHeaderGroups().map((headerGroup, groupIndex) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => {
                  const meta = header.column.columnDef.meta;
                  const lastSticky =
                    meta?.positioning?.sticky != null &&
                    headerGroup.headers[index + 1]?.column.columnDef.meta
                      ?.positioning?.sticky == null;

                  return (
                    <th
                      className={clsxm(
                        "border-b !border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-900 whitespace-nowrap",
                        {
                          "not-last:border-r":
                            header.colSpan === 1 && !meta?.positioning?.sticky,
                          "not-last:border-r-2":
                            lastSticky ||
                            header.colSpan > 1 ||
                            meta?.positioning?.lastInGroup,
                        },
                      )}
                      colSpan={header.colSpan}
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        position: "sticky",
                        top: groupIndex * 52,
                        ...(meta?.positioning?.sticky === "left"
                          ? {
                              left: meta?.positioning?.stickyOffset,
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
            {table.getRowModel().rows.map((row) => {
              const cells = row.getVisibleCells();
              return (
                <tr
                  className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  key={row.id}
                >
                  {cells.map((cell, index) => {
                    const meta = cell.column.columnDef.meta;
                    const lastSticky =
                      meta?.positioning?.sticky != null &&
                      cells[index + 1]?.column.columnDef.meta?.positioning
                        ?.sticky == null;

                    return (
                      <td
                        className={clsxm(
                          "px-4 py-3 text-sm text-gray-900 bg-white",
                          {
                            "border-l !border-green-600":
                              !meta?.positioning?.sticky,
                            "border-r border-r-2 !border-r-gray-200":
                              lastSticky,
                          },
                        )}
                        key={cell.id}
                        style={{
                          width: cell.column.getSize(),
                          ...(meta?.positioning?.sticky === "left"
                            ? {
                                position: "sticky",
                                left: meta?.positioning?.stickyOffset,
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
