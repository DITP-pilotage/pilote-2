import { ComponentProps } from "react";
import { clsxm } from "@/utils/clsxm";
import { MessageErreur } from "@/components/PageEvaluation/MessageErreur";

export const InputNote = ({
  errorMessage,
  className,
  ...props
}: ComponentProps<"input"> & { errorMessage?: string }) => {
  return (
    <div className="flex flex-col">
      <div
        className={clsxm(
          "border !rounded-md !bg-white flex items-stretch overflow-hidden",
          "focus-within:outline-2 focus-within:outline-dsfr-info-main-525 focus-within:outline-offset-2",
          {
            "!border-error text-error": !!errorMessage,
          },
        )}
      >
        <input
          className={clsxm(
            "focus:!outline-none w-[6ch] text-right px-4 py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            className,
            {
              "!border-dsfr-error-425": !!errorMessage,
            },
          )}
          {...props}
          type="number"
        />
        <span
          className={clsxm(
            "px-2 flex items-center font-semibold text-sm py-2 border-l border-gray-200 bg-gray-50",
            {
              "!border-error/30 !bg-error/5": !!errorMessage,
            },
          )}
        >
          %
        </span>
      </div>
      <div className="relative h-3 mt-1">
        {errorMessage ? (
          <MessageErreur className="absolute right-0">
            {errorMessage}
          </MessageErreur>
        ) : null}
      </div>
    </div>
  );
};
