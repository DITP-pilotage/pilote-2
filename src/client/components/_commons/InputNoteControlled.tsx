import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { ComponentProps } from "react";
import { InputNote } from "@/components/_commons/InputNote";

export function InputNoteControlled<T extends FieldValues>({
  name,
  control,
  readOnly,
  onChange,
  ...props
}: ComponentProps<"input"> & {
  name: Path<T>;
  control: Control<T>;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <InputNote
          {...props}
          {...field}
          disabled={readOnly}
          errorMessage={fieldState.error?.message}
          onChange={(e) => {
            const value = e.target.valueAsNumber;
            field.onChange(Number.isNaN(value) ? null : value);
            onChange?.(e);
          }}
          value={field.value?.toString() ?? ""}
        />
      )}
    />
  );
}
