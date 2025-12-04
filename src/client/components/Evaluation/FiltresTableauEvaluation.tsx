import { Table } from "@tanstack/react-table";
import { Checkbox } from "radix-ui";
import { useId } from "react";
import { ButtonTag } from "@/components/_commons/ButtonTag";
import { Icone } from "@/components/_commons/Icone";
import { CheckLineIcon } from "@/components/_commons/Icones/CheckLineIcon";
import { FilterIcon } from "@/components/_commons/Icones/FilterIcon";
import { Bouton } from "@/components/_commons/Bouton/Bouton";

const CheckboxesFiltre = ({
  label,
  values,
  options,
  onChange,
  getOptionLabel,
}: {
  label: string;
  values: string[];
  options: string[];
  onChange(values: string[]): void;
  getOptionLabel(option: string): string;
}) => {
  const id = useId();
  return (
    <div className="flex items-center gap-2 !text-sm">
      <div className="font-semibold whitespace-nowrap">{label} :</div>
      <div className="flex items-center flex-wrap gap-2">
        {options.map((option) => {
          const isActive = values.includes(option);
          const optionId = `${id}-${option}`;
          return (
            <label
              className="flex items-center gap-2 cursor-pointer"
              htmlFor={optionId}
              key={option}
            >
              <Checkbox.Root
                checked={isActive}
                className="!border-2 !border-gray-500 w-4 h-4 transition-colors rounded flex items-center justify-center bg-white data-[state=checked]:!border-primary data-[state=checked]:bg-dsfr-blue-france-925"
                id={optionId}
                onCheckedChange={() => {
                  if (isActive) {
                    onChange(
                      values.filter((filterValue) => filterValue !== option),
                    );
                  } else {
                    onChange([...values, option]);
                  }
                }}
              >
                <Checkbox.Indicator>
                  <Icone
                    className="w-3.5 h-3.5 text-primary"
                    icone={CheckLineIcon}
                  />
                </Checkbox.Indicator>
              </Checkbox.Root>
              {getOptionLabel(option)}
            </label>
          );
        })}
      </div>
    </div>
  );
};

const TagsFiltre = ({
  label,
  labelToutesOptions,
  value,
  options,
  onChange,
  getOptionLabel,
}: {
  label: string;
  labelToutesOptions: string;
  value: string | null;
  options: string[];
  onChange(value: string | null): void;
  getOptionLabel(option: string): string;
}) => (
  <div className="flex items-center gap-2 !text-sm">
    <div className="font-semibold whitespace-nowrap">{label} :</div>
    <div className="flex items-center flex-wrap gap-2">
      <ButtonTag isActive={value == null} onClick={() => onChange(null)}>
        {labelToutesOptions}
      </ButtonTag>
      {options.map((option) => {
        const isActive = value == option;
        return (
          <ButtonTag
            isActive={isActive}
            key={option}
            onClick={() => {
              if (isActive) {
                onChange(null);
              } else {
                onChange(option);
              }
            }}
            type="button"
          >
            {getOptionLabel(option)}
          </ButtonTag>
        );
      })}
    </div>
  </div>
);

export function FiltresTableauEvaluation<T>({ table }: { table: Table<T> }) {
  return (
    <section className="space-y-2 p-6">
      <header className="flex items-baseline gap-2">
        <Icone className="h-4.5 w-4.5 self-center" icone={FilterIcon} />
        <h2 className="!text-base !mb-0 !text-primary">Filtrage</h2>
        <Bouton
          label="Réinitialiser les filtres"
          onClick={() => table.resetColumnFilters(false)}
          size="sm"
          variant="link"
        />
      </header>
      {table
        .getAllColumns()
        .filter((column) => column.getCanFilter())
        .map((column) => {
          const filter = column.columnDef.meta?.filter;
          if (filter == null) return;
          switch (filter.type) {
            case "checkboxes": {
              return (
                <CheckboxesFiltre
                  getOptionLabel={(option) => filter.getOptionLabel(option)}
                  key={column.id}
                  label={filter.label}
                  onChange={(newValues) => column.setFilterValue(newValues)}
                  options={filter.getOptions(column)}
                  values={(column.getFilterValue() as string[]) ?? []}
                />
              );
            }
            case "tags": {
              const currentFilterValue = column.getFilterValue() as
                | string[]
                | undefined;
              return (
                <TagsFiltre
                  getOptionLabel={(option) => filter.getOptionLabel(option)}
                  key={column.id}
                  label={filter.label}
                  labelToutesOptions={filter.labelToutesLesOptions}
                  onChange={(newValue) =>
                    column.setFilterValue(newValue == null ? [] : [newValue])
                  }
                  options={filter.getOptions(column)}
                  value={currentFilterValue?.[0] ?? null}
                />
              );
            }
          }

          return null;
        })}
    </section>
  );
}
