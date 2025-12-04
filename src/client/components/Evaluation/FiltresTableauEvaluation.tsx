import { Table } from "@tanstack/react-table";
import { ButtonTag } from "@/components/_commons/ButtonTag";

const MultiFiltre = ({
  label,
  labelToutesOptions,
  values,
  options,
  onChange,
  getOptionLabel,
}: {
  label: string;
  labelToutesOptions: string;
  values: string[];
  options: string[];
  onChange(values: string[]): void;
  getOptionLabel(option: string): string;
}) => (
  <div className="flex items-center gap-2 !text-sm">
    <div className="font-semibold whitespace-nowrap">{label} :</div>
    <div className="flex items-center flex-wrap gap-2">
      <ButtonTag isActive={values.length === 0} onClick={() => onChange([])}>
        {labelToutesOptions}
      </ButtonTag>
      {options.map((option) => {
        const isActive = values.includes(option);
        return (
          <ButtonTag
            isActive={isActive}
            key={option}
            onClick={() => {
              if (isActive) {
                onChange(
                  values.filter((filterValue) => filterValue !== option),
                );
              } else {
                onChange([...values, option]);
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
          switch (filter.type) {
            case "multi": {
              const values = [...column.getFacetedUniqueValues().keys()].filter(
                Boolean,
              );
              return (
                <MultiFiltre
                  getOptionLabel={(option) => filter.getValueLabel(option)}
                  key={column.id}
                  label={filter.label}
                  labelToutesOptions={filter.labelToutesLesOptions}
                  onChange={(newValues) => column.setFilterValue(newValues)}
                  options={values}
                  values={(column.getFilterValue() as string[]) ?? []}
                />
              );
            }
            case "single": {
              const values = [...column.getFacetedUniqueValues().keys()].filter(
                Boolean,
              );
              return (
                <SingleFiltre
                  getOptionLabel={(option) => filter.getValueLabel(option)}
                  key={column.id}
                  label={filter.label}
                  labelToutesOptions={filter.labelToutesLesOptions}
                  onChange={(newValues) => column.setFilterValue(newValues)}
                  options={values}
                  value={
                    (column.getFilterValue() as string | undefined) ?? null
                  }
                />
              );
            }
          }

          return null;
        })}
    </div>
  );
}
