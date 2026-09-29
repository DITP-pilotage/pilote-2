import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { GroupeCasesACocher } from "@/components/_commons/GroupeCasesACocher/GroupeCasesACocher";
import { Icone } from "@/components/_commons/Icone";
import { ArrowGoBackIcon } from "@/components/_commons/Icones/ArrowGoBackIcon";
import { MultiSelectFiltre } from "@/components/_commons/MultiSelectFiltre/MultiSelectFiltre";
import { clsxm } from "@/utils/clsxm";
import { getColumnMeta, hasFeature } from "./features";
import type { AnyColumn, AnyTable } from "./types";

export type DataTableFiltersProps = { className?: string };

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

function ColumnFilter({ column }: { column: AnyColumn }) {
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
      className={filter.className}
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

  return (
    <section
      aria-label="Filtres du tableau"
      className={clsxm(
        "flex flex-col gap-4 px-6 py-4 border-b border-dsfr-grey-900 bg-dsfr-grey-1000",
        className,
      )}
    >
      {hasFeature(table, "globalFilteringFeature") && (
        <div className="w-full max-w-sm">
          <BarreDeRecherche
            changementDeLaRechercheCallback={(event) =>
              table.setGlobalFilter(event.target.value)
            }
            valeur={table.store.state.globalFilter ?? ""}
          />
        </div>
      )}
      {columns.map((column: AnyColumn) => (
        <ColumnFilter column={column} key={column.id} />
      ))}
      <Bouton
        disabled={!hasActiveFilters}
        iconLeft={
          <Icone
            className="w-4 h-4 text-current rotate-y-180"
            icone={ArrowGoBackIcon}
          />
        }
        label="Réinitialiser les filtres"
        onClick={onResetFilters}
        size="sm"
        variant="secondary"
      />
    </section>
  );
}
