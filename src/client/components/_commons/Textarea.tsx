import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { ComponentProps } from "react";
import { clsxm } from "@/utils/clsxm";
import { MessageErreur } from "@/components/PageEvaluation/MessageErreur";

export function Textarea<T extends FieldValues>({
  name,
  control,
  readOnly,
  onBlur,
  className,
  ...props
}: ComponentProps<"textarea"> & {
  name: Path<T>;
  control: Control<T>;
}) {
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
              Commentaire
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
                node?.focus();
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
