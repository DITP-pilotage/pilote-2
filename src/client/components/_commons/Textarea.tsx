import { Control, Controller } from "react-hook-form";
import { clsxm } from "@/utils/clsxm";
import { MessageErreur } from "@/components/PageEvaluation/MessageErreur";

export const Textarea = ({
  name,
  control,
  readOnly,
}: {
  name: string;
  // A améliorer ?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  readOnly: boolean;
}) => {
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
              className={clsxm(
                "border !rounded-md !bg-white py-2 px-4 field-sizing-content",
                {
                  "!border-error": !!fieldState.error,
                },
              )}
              id={fieldId}
              {...field}
              disabled={readOnly}
              onBlur={(e) => {
                field.onBlur();
                if (!e.target.value) {
                  setDisplayComment(false);
                }
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
};
