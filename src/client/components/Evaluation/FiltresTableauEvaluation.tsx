import { Table } from "@tanstack/react-table";
import { Checkbox } from "radix-ui";
import { useId } from "react";
import { ButtonTag } from "@/components/_commons/ButtonTag";
import { Icone } from "@/components/_commons/Icone";
import { CheckLineIcon } from "@/components/_commons/Icones/CheckLineIcon";

const MultiFiltre = ({
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

const SingleFiltre = ({
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
    <div className="space-y-2 p-6">
      {table
        .getAllColumns()
        .filter((column) => column.getCanFilter())
        .map((column) => {
          const filter = column.columnDef.meta?.filter;
          if (filter == null) return;
          console.log(column.columnDef.id, filter.getOptions(column));
          switch (filter.type) {
            case "multi": {
              return (
                <MultiFiltre
                  getOptionLabel={(option) => filter.getOptionLabel(option)}
                  key={column.id}
                  label={filter.label}
                  onChange={(newValues) => column.setFilterValue(newValues)}
                  options={filter.getOptions(column)}
                  values={(column.getFilterValue() as string[]) ?? []}
                />
              );
            }
            case "single": {
              const currentFilterValue = column.getFilterValue() as
                | string[]
                | undefined;
              return (
                <SingleFiltre
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
    </div>
  );
}
