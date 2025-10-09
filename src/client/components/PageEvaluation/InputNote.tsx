import { Controller } from "react-hook-form";
import { useFormEvaluation } from "@/components/PageEvaluation/form";
import { clsxm } from "@/utils/clsxm";
import { MessageErreur } from "@/components/PageEvaluation/MessageErreur";
import { pageEvaluation } from "@/components/PageEvaluation/PageEvaluationServerSideContext";

export function InputNote({
  name,
}: {
  name:
    | `criteres.${number}.sousCriteres.${number}.note`
    | `objectifs.${number}.note`;
}) {
  const form = useFormEvaluation();
  const { autoEvaluation } = pageEvaluation.useServerSidePropsContext();

  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <div className="flex flex-col">
          <div
            className={clsxm(
              "border !rounded-md !bg-white flex items-stretch overflow-hidden",
              "focus-within:outline-2 focus-within:outline-dsfr-info-main-525 focus-within:outline-offset-2",
              {
                "!border-error text-error": !!fieldState.error,
              },
            )}
          >
            <input
              className={clsxm(
                "focus:!outline-none w-[6ch] text-right px-4 py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                {
                  "!border-dsfr-error-425": fieldState.error != null,
                },
              )}
              type="number"
              {...field}
              disabled={autoEvaluation.readOnly}
              onChange={(e) => {
                const value = e.target.valueAsNumber;
                field.onChange(Number.isNaN(value) ? null : value);
              }}
              value={field.value?.toString() ?? ""}
            />
            <span
              className={clsxm(
                "px-2 flex items-center font-semibold text-sm py-2 border-l border-gray-200 bg-gray-50",
                {
                  "!border-error/30 !bg-error/5": !!fieldState.error,
                },
              )}
            >
              %
            </span>
          </div>
          <div className="relative h-3 mt-1">
            {fieldState.error ? (
              <MessageErreur className="absolute right-0">
                {fieldState.error.message}
              </MessageErreur>
            ) : null}
          </div>
        </div>
      )}
    />
  );
}
