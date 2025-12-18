import { flexRender } from "@tanstack/react-table";
import { useTableauPilotage } from "@/components/PagePilotage/useTableauPilotage";
import { clsxm } from "@/utils/clsxm";
import { LegendeTableauPilotage } from "@/components/PagePilotage/LegendeTableauPilotage";
import { MenuActionTableauPilotage } from "@/components/PagePilotage/MenuActionTableauPilotage";

export const TableauPilotage = () => {
  const { table, fichesSelectionneesIds } = useTableauPilotage();

  const columns = table.getAllLeafColumns();
  const gridTemplateColumns = columns
    .map((col) => `${col.getSize()}px`)
    .join(" ");

  const selectedCount = fichesSelectionneesIds.length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <LegendeTableauPilotage />
        <MenuActionTableauPilotage
          fichesSelectionneesIds={fichesSelectionneesIds}
        />
      </div>

      <div className="overflow-auto border border-gray-200 rounded-lg max-h-[75vh]">
        <div
          className="w-full"
          style={{
            display: "grid",
            gridTemplateColumns,
          }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2 sticky top-0 z-40 bg-white"
            style={{
              gridColumn: `1 / -1`,
            }}
          >
            <input
              checked={table.getIsAllRowsSelected()}
              className="cursor-pointer"
              onChange={table.getToggleAllRowsSelectedHandler()}
              ref={(el) => {
                if (el) {
                  el.indeterminate = table.getIsSomeRowsSelected();
                }
              }}
              type="checkbox"
            />
            <span className="text-sm text-gray-700">
              {selectedCount} ligne(s) sélectionnée(s)
            </span>
          </div>

          <div className="contents">
            {table.getHeaderGroups().map((headerGroup, groupIndex) =>
              headerGroup.headers.map((header, index) => {
                const meta = header.column.columnDef.meta;
                const lastSticky =
                  meta?.positioning?.sticky != null &&
                  headerGroup.headers[index + 1]?.column.columnDef.meta
                    ?.positioning?.sticky == null;

                return (
                  <div
                    className={clsxm("px-4 py-3 text-left text-sm", {
                      "not-last:border-r":
                        header.colSpan === 1 && !meta?.positioning?.sticky,
                      "not-last:border-r-2":
                        lastSticky ||
                        header.colSpan > 1 ||
                        meta?.positioning?.lastInGroup,
                    })}
                    key={header.id}
                    style={{
                      gridColumn:
                        header.colSpan > 1
                          ? `span ${header.colSpan}`
                          : undefined,
                      position: "sticky",
                      top: 52 + groupIndex * 52,
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
                  </div>
                );
              }),
            )}
          </div>

          {table.getRowModel().rows.map((row, rowIndex) => {
            const cells = row.getVisibleCells();
            const previousRow = table.getRowModel().rows[rowIndex - 1];
            const isNewGroup =
              rowIndex > 0 &&
              previousRow &&
              previousRow.original.rattachementGroupe !==
                row.original.rattachementGroupe;

            return (
              <div className="contents group" key={row.id}>
                {cells.map((cell, index) => {
                  const meta = cell.column.columnDef.meta;
                  const lastSticky =
                    meta?.positioning?.sticky != null &&
                    cells[index + 1]?.column.columnDef.meta?.positioning
                      ?.sticky == null;

                  return (
                    <div
                      className={clsxm(
                        "px-4 py-3 border-gray-200 text-sm text-gray-900 bg-white group-hover:bg-gray-50 transition-colors border-b border-gray-100",
                        {
                          "not-last:border-r": !meta?.positioning?.sticky,
                          "not-last:border-r-2":
                            lastSticky || meta?.positioning?.lastInGroup,
                          "border-t": isNewGroup,
                          "last:border-b-0":
                            rowIndex === table.getRowModel().rows.length - 1,
                        },
                      )}
                      key={cell.id}
                      style={{
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
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
