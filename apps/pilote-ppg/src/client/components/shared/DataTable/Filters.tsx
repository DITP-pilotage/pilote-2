import type { ReactNode } from "react";
import { Button } from "@/components/shared/Button";
import { GroupeCasesACocher } from "@/components/_commons/GroupeCasesACocher/GroupeCasesACocher";
import { Icone } from "@/components/_commons/Icone";
import { ArrowGoBackIcon } from "@/components/_commons/Icones/ArrowGoBackIcon";
import { MultiSelectFiltre } from "@/components/_commons/MultiSelectFiltre/MultiSelectFiltre";
import { clsxm } from "@/utils/clsxm";
import { getColumnMeta, hasFeature } from "./features";
import { DataTableSearch } from "./Search";
import type { AnyColumn, AnyTable } from "./types";

export type DataTableFiltersProps = {
  className?: string;
  // « inline » : recherche et filtres sur une ligne, puis `resultats` et le bouton de réinitialisation.
  // « compact » : tout sur une ligne serrée, libellés dans les boutons, pour un espace étroit comme le chat.
  layout?: "stack" | "inline" | "compact";
  resultats?: ReactNode;
  searchPlaceholder?: string;
  // Contrôles ajoutés après les filtres, par exemple le choix du regroupement.
  children?: ReactNode;
};

export const COMPACT_CONTROL_CLASSNAME =
  "py-1 text-sm border rounded-t border-b-2 border-b-gray-600 bg-dsfr-contrast-grey";

// Au-delà, la liste d'un filtre compact propose une recherche.
const COMPACT_SEARCH_THRESHOLD = 8;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

function ColumnFilter({
  column,
  className,
  compact = false,
}: {
  column: AnyColumn;
  className?: string;
  compact?: boolean;
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
  const getOptionLabel = (value: string) =>
    filter.options.find((option) => option.value === value)?.label ?? value;
  const optionGroups = filter.groups?.map((group) => ({
    label: group.label,
    options: group.values,
  })) ?? [{ label: "", options: filter.options.map((option) => option.value) }];

  if (compact) {
    return (
      <MultiSelectFiltre
        className={clsxm("w-auto", filter.className, className)}
        classNameBouton={clsxm(
          COMPACT_CONTROL_CLASSNAME,
          "gap-2 px-3",
          filter.buttonClassName,
        )}
        classNameContenu="w-80 max-w-[90vw]"
        getOptionLabel={getOptionLabel}
        getPlaceholder={(selection) =>
          selection.length === 0
            ? filter.label
            : `${filter.label} (${selection.length})`
        }
        onChange={onChange}
        optionGroups={optionGroups}
        showGroupSelection={filter.groups != null}
        showSearch={filter.options.length > COMPACT_SEARCH_THRESHOLD}
        values={values}
      />
    );
  }
  return (
    <MultiSelectFiltre
      className={clsxm(filter.className, className)}
      classNameBouton={filter.buttonClassName}
      getOptionLabel={getOptionLabel}
      label={filter.label}
      onChange={onChange}
      optionGroups={optionGroups}
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
  searchPlaceholder,
  children,
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

  const hasSearch = hasFeature(table, "globalFilteringFeature");

  if (layout === "compact") {
    return (
      <section
        aria-label="Filtres du tableau"
        className={clsxm(
          "flex flex-wrap items-center gap-2 px-4 py-2 border-b border-dsfr-grey-900",
          className,
        )}
      >
        {hasSearch && (
          <DataTableSearch
            button="none"
            className="w-auto min-w-40 flex-1"
            inputClassName="px-3 py-1 text-sm"
            placeholder={searchPlaceholder}
            table={table}
          />
        )}
        {columns.map((column: AnyColumn) => (
          <ColumnFilter column={column} compact key={column.id} />
        ))}
        {children}
        {resultats != null && (
          <span aria-live="polite" className="text-sm font-medium">
            {resultats}
          </span>
        )}
        {hasActiveFilters && (
          <Button onClick={onResetFilters} size="sm" variant="link">
            Réinitialiser
          </Button>
        )}
      </section>
    );
  }

  const recherche = hasSearch ? (
    <DataTableSearch placeholder={searchPlaceholder} table={table} />
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
            {children}
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
          {children}
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
