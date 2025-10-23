import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { ComponentProps, RefObject, useImperativeHandle, useRef } from "react";
import { clsxm } from "@/utils/clsxm";
import { MessageErreur } from "@/components/PageEvaluation/MessageErreur";

export type TextareaRef = {
  focus: () => void;
};

export function Textarea<T extends FieldValues>({
  label = "Commentaire",
  name,
  control,
  readOnly,
  onBlur,
  className,
  textareaRef,
  ...props
}: ComponentProps<"textarea"> & {
  label?: string;
  name: Path<T>;
  control: Control<T>;
  textareaRef?: RefObject<TextareaRef>;
}) {
  const internalRef = useRef<HTMLTextAreaElement | null>(null);

  useImperativeHandle(textareaRef, () => ({
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
              className={clsxm("font-bold text-sm", {
                "text-error": !!fieldState.error,
              })}
              htmlFor={fieldId}
            >
              {label}
            </label>
            <textarea
              {...props}
              className={clsxm(
                "border !rounded-md !bg-white py-2 px-4 field-sizing-content",
                {
                  "!border-error": !!fieldState.error,
                },
                className,
              )}
              id={fieldId}
              {...field}
              disabled={readOnly}
              onBlur={(event) => {
                field.onBlur();
                onBlur?.(event);
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

              <span className="text-xs ml-auto">
                {field.value.length} / 600
              </span>
            </div>
          </div>
        );
      }}
    />
  );
}
