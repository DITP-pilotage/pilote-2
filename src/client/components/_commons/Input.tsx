import { Control, Controller, FieldValues, Path } from "react-hook-form";
import {
  ComponentProps,
  ReactNode,
  RefObject,
  useImperativeHandle,
  useRef,
} from "react";
import { clsxm } from "@/utils/clsxm";
import { MessageErreur } from "@/components/PageAutoEvaluation/MessageErreur";

export type InputRef = {
  focus: () => void;
};

export function Input<T extends FieldValues>({
  label = "Commentaire",
  name,
  control,
  readOnly,
  placeholder,
  onChange,
  onBlur,
  className,
  required,
  inputRef,
  charLimit,
  ...props
}: ComponentProps<"input"> & {
  label?: ReactNode;
  placeholder?: string;
  name: Path<T>;
  control: Control<T>;
  inputRef?: RefObject<InputRef>;
  charLimit?: number;
}) {
  const internalRef = useRef<HTMLInputElement | null>(null);

  useImperativeHandle(inputRef, () => ({
    focus: () => {
      internalRef.current?.focus();
    },
  }));

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const fieldId = `${name}.commentaire`;
        return (
          <div className="flex flex-col gap-1">
            <label
              className={clsxm("italic !text-xs font-medium", {
                "text-error": !!fieldState.error,
              })}
              htmlFor={fieldId}
            >
              {label}{" "}
              {required ? <span className="text-red-500">*</span> : null}
            </label>
            <input
              {...props}
              className={clsxm(
                "border !rounded-t !border-b !border-b-gray-600 !bg-white !py-2 !px-4 field-sizing-content",
                {
                  "!border-error": !!fieldState.error,
                },
                className,
              )}
              id={fieldId}
              placeholder={placeholder}
              {...field}
              disabled={readOnly}
              onBlur={(event) => {
                field.onBlur();
                onBlur?.(event);
              }}
              onChange={(event) => {
                field.onChange(event);
                onChange?.(event);
              }}
              ref={(node) => {
                internalRef.current = node;
                field.ref(node);
              }}
            />
            <div className="flex justify-between mt-1">
              {fieldState.error ? (
                <MessageErreur>{fieldState.error.message}</MessageErreur>
              ) : null}

              {charLimit != null && (
                <span className="text-[10px] ml-auto">
                  {field.value.length} / {charLimit}
                </span>
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
