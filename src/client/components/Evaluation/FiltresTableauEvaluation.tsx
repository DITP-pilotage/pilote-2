import { Table } from "@tanstack/react-table";
import { ButtonTag } from "@/components/_commons/ButtonTag";

export function FiltresTableauEvaluation<T>({ table }: { table: Table<T> }) {
  return (
    <div className="space-y-2 p-6">
      {table
        .getAllColumns()
        .filter((column) => column.getCanFilter())
        .map((column) => {
          const values = [...column.getFacetedUniqueValues().keys()].filter(
            Boolean,
          );
          const currentFilter = (column.getFilterValue() as string[]) ?? [];

          return (
            <div className="flex items-center gap-2 !text-sm" key={column.id}>
              <div className="font-semibold whitespace-nowrap">
                {column.columnDef.meta?.filter?.label} :
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <ButtonTag
                  isActive={currentFilter.length === 0}
                  onClick={() => column.setFilterValue([])}
                >
                  {column.columnDef.meta?.filter?.labelToutesLesOptions}
                </ButtonTag>
                {values.map((value) => {
                  const isActive = currentFilter.includes(value);
                  return (
                    <ButtonTag
                      isActive={isActive}
                      key={value}
                      onClick={() => {
                        if (isActive) {
                          column.setFilterValue(
                            currentFilter.filter(
                              (filterValue) => filterValue !== value,
                            ),
                          );
                        } else {
                          column.setFilterValue([...currentFilter, value]);
                        }
                      }}
                      type="button"
                    >
                      {column.columnDef.meta?.filter?.getValueLabel(value)}
                    </ButtonTag>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
}
