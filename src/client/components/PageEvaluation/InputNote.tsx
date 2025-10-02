import { Controller } from "react-hook-form";
import { useFormEvaluation } from "@/components/PageEvaluation/form";
import { clsxm } from "@/utils/clsxm";

export function InputNote({ name }: { name: string }) {
  const form = useFormEvaluation();
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <div className="border !rounded-md !bg-white flex items-stretch focus-within:outline-2 focus-within:outline-dsfr-info-main-525 focus-within:outline-offset-2">
          <input
            className={clsxm(
              "focus:!outline-none w-[6ch] text-right px-4 py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              {
                "!border-dsfr-error-425": fieldState.error != null,
              },
            )}
            type="number"
            {...field}
            onChange={(e) => field.onChange(e.target.valueAsNumber)}
          />
          <span className="px-2 flex items-center font-semibold text-sm py-2 border-l border-gray-200">
            %
          </span>
        </div>
      )}
    />
  );
}
