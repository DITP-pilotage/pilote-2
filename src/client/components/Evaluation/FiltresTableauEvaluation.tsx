import { FiltreMultiselectOptionGroup, Table } from "@tanstack/react-table";
import { Checkbox } from "radix-ui";
import { useId } from "react";
import { ButtonTag } from "@/components/_commons/ButtonTag";
import { Icone } from "@/components/_commons/Icone";
import { CheckLineIcon } from "@/components/_commons/Icones/CheckLineIcon";
import { FilterIcon } from "@/components/_commons/Icones/FilterIcon";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";
import { Dropdown } from "@/components/shared/Dropdown";

const MultiSelectFiltre = ({
  label,
  values,
  optionGroups,
  onChange,
  getOptionLabel,
}: {
  label: string;
  values: string[];
  optionGroups: FiltreMultiselectOptionGroup[];
  onChange(values: string[]): void;
  getOptionLabel(option: string): string;
}) => {
  const id = useId();
  return (
    <div className="flex items-center gap-2 !text-sm">
      <div className="font-semibold whitespace-nowrap">{label} :</div>
      <Dropdown.Root>
        <Dropdown.Trigger asChild>
          <button
            className="!flex items-center gap-3 !px-4 !py-1.5 !font-medium border !rounded-t !border-b-2 !border-b-gray-600 !bg-dsfr-contrast-grey"
            type="button"
          >
            {values.length} territoire(s) sélectionné(s)
            <Icone className="text-current" icone={ArrowSLine2Icon} />
          </button>
        </Dropdown.Trigger>

        <Dropdown.Content align="start">
          <div className="divide-y divide-dsfr-mention-grey -m-4 py-2">
            {optionGroups
              .filter((group) => group.options.length > 0)
              .map((group) => (
                <div className="px-4 py-1" key={group.label}>
                  <div className="uppercase text-dsfr-mention-grey">
                    {group.label}
                  </div>
                  <ul>
                    {group.options.map((option) => {
                      return <li key={option}>{getOptionLabel(option)}</li>;
                    })}
                  </ul>
                </div>
              ))}
          </div>
        </Dropdown.Content>
      </Dropdown.Root>
    </div>
  );
};

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
            case "multiselect": {
              return (
                <MultiSelectFiltre
                  getOptionLabel={(option) => filter.getOptionLabel(option)}
                  key={column.id}
                  label={filter.label}
                  onChange={(newValues) => column.setFilterValue(newValues)}
                  optionGroups={filter.getOptionGroups(column)}
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
