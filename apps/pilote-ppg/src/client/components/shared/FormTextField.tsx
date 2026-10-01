import { ComponentProps, ReactNode, Ref } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { TextareaField, TextField } from "@/components/shared/TextField";

type FormFieldProps<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  label?: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  readOnly?: boolean;
  charLimit?: number;
};

const mergeRefs =
  <E,>(...refs: (Ref<E> | undefined)[]) =>
  (node: E | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };

export function FormTextField<T extends FieldValues>({
  name,
  control,
  readOnly,
  charLimit,
  onChange,
  onBlur,
  ref,
  ...props
}: Omit<ComponentProps<"input">, "name"> & FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          counter={
            charLimit == null
              ? undefined
              : { length: String(field.value ?? "").length, max: charLimit }
          }
          disabled={readOnly}
          errorMessage={fieldState.error?.message}
          id={name}
          name={field.name}
          onBlur={(event) => {
            field.onBlur();
            onBlur?.(event);
          }}
          onChange={(event) => {
            field.onChange(event);
            onChange?.(event);
          }}
          ref={mergeRefs(field.ref, ref)}
          value={field.value ?? ""}
        />
      )}
    />
  );
}

export function FormTextareaField<T extends FieldValues>({
  name,
  control,
  readOnly,
  charLimit,
  onChange,
  onBlur,
  ref,
  ...props
}: Omit<ComponentProps<"textarea">, "name"> & FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextareaField
          {...props}
          counter={
            charLimit == null
              ? undefined
              : { length: String(field.value ?? "").length, max: charLimit }
          }
          disabled={readOnly}
          errorMessage={fieldState.error?.message}
          id={name}
          name={field.name}
          onBlur={(event) => {
            field.onBlur();
            onBlur?.(event);
          }}
          onChange={(event) => {
            field.onChange(event);
            onChange?.(event);
          }}
          ref={mergeRefs(field.ref, ref)}
          value={field.value ?? ""}
        />
      )}
    />
  );
}
