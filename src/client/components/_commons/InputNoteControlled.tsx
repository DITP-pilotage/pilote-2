import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { ComponentProps } from "react";
import { InputNote } from "@/components/_commons/InputNote";

export function InputNoteControlled<T extends FieldValues>({
  name,
  control,
  readOnly,
  onChange,
  label,
  ...props
}: ComponentProps<"input"> & {
  name: Path<T>;
  control: Control<T>;
  label?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const fieldId = `${name}.note`;
        return (
          <InputNote
            {...props}
            {...field}
            disabled={readOnly}
            errorMessage={fieldState.error?.message}
            id={fieldId}
            label={label}
            onChange={(e) => {
              const value = e.target.valueAsNumber;
              field.onChange(Number.isNaN(value) ? null : value);
              onChange?.(e);
            }}
            value={field.value?.toString() ?? ""}
          />
        );
      }}
    />
  );
}
