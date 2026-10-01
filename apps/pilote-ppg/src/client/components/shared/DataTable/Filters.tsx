import type { ReactNode } from "react";
import { Button } from "@/components/shared/Button";
import { SearchInput } from "@/components/shared/SearchInput";
import { GroupeCasesACocher } from "@/components/_commons/GroupeCasesACocher/GroupeCasesACocher";
import { Icone } from "@/components/_commons/Icone";
import { ArrowGoBackIcon } from "@/components/_commons/Icones/ArrowGoBackIcon";
import { MultiSelectFiltre } from "@/components/_commons/MultiSelectFiltre/MultiSelectFiltre";
import { clsxm } from "@/utils/clsxm";
import { getColumnMeta, hasFeature } from "./features";
import type { AnyColumn, AnyTable } from "./types";

export type DataTableFiltersProps = {
  className?: string;
  // « inline » : recherche et filtres sur une ligne, puis `resultats` et le bouton de réinitialisation.
  layout?: "stack" | "inline";
  resultats?: ReactNode;
};

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

function ColumnFilter({
  column,
  className,
}: {
  column: AnyColumn;
  className?: string;
}) {
  const filter = getColumnMeta(column)?.filter;
  if (!filter) return null;
  const values = toStringArray(column.getFilterValue());
  const onChange = (nextValues: string[]) => column.setFilterValue(nextValues);

  if (filter.type === "checkboxes") {
    return (
      <GroupeCasesACocher
        label={filter.label}
        onChange={onChange}
        options={filter.options.map((option) => ({
          valeur: option.value,
          label: option.label,
        }))}
        values={values}
      />
    );
  }
  return (
    <MultiSelectFiltre
      className={clsxm(filter.className, className)}
      classNameBouton={filter.buttonClassName}
      getOptionLabel={(value) =>
        filter.options.find((option) => option.value === value)?.label ?? value
      }
      label={filter.label}
      onChange={onChange}
      optionGroups={
        filter.groups?.map((group) => ({
          label: group.label,
          options: group.values,
        })) ?? [
          { label: "", options: filter.options.map((option) => option.value) },
        ]
      }
      showGroupSelection={false}
      values={values}
    />
  );
}

export function DataTableFilters({
  table,
  className,
  layout = "stack",
  resultats,
  hasActiveFilters,
  onResetFilters,
}: DataTableFiltersProps & {
  table: AnyTable;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}) {
  const columns = hasFeature(table, "columnFilteringFeature")
    ? table
        .getAllLeafColumns()
        .filter((column: AnyColumn) => getColumnMeta(column)?.filter != null)
    : [];

  const recherche = hasFeature(table, "globalFilteringFeature") ? (
    <SearchInput
      onChange={(event) => table.setGlobalFilter(event.target.value)}
      value={table.store.state.globalFilter ?? ""}
    />
  ) : null;

  const reinitialiser = (
    <Button
      disabled={!hasActiveFilters}
      iconLeft={
        <Icone
          className="w-4 h-4 text-current rotate-y-180"
          icone={ArrowGoBackIcon}
        />
      }
      onClick={onResetFilters}
      size="sm"
      variant="secondary"
    >
      Réinitialiser les filtres
    </Button>
  );

  return (
    <section
      aria-label="Filtres du tableau"
      className={clsxm(
        "flex flex-col gap-4 px-6 py-4 border-b border-dsfr-grey-900 bg-dsfr-grey-1000",
        className,
      )}
    >
      {layout === "inline" ? (
        <>
          <div className="flex flex-wrap items-end gap-4">
            {recherche && <div className="w-full md:w-80">{recherche}</div>}
            {columns.map((column: AnyColumn) => (
              <div className="w-full md:w-64" key={column.id}>
                <ColumnFilter
                  className="flex-col items-stretch gap-1.5"
                  column={column}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {resultats != null && (
              <span
                aria-live="polite"
                className="text-sm font-medium text-dsfr-grey-50"
              >
                {resultats}
              </span>
            )}
            <div className="ml-auto">{reinitialiser}</div>
          </div>
        </>
      ) : (
        <>
          {recherche && <div className="w-full max-w-sm">{recherche}</div>}
          {columns.map((column: AnyColumn) => (
            <ColumnFilter column={column} key={column.id} />
          ))}
          {resultats != null && (
            <span aria-live="polite" className="text-sm font-medium">
              {resultats}
            </span>
          )}
          {reinitialiser}
        </>
      )}
    </section>
  );
}
