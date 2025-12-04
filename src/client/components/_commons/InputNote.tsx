import { ComponentProps, forwardRef, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";
import { MessageErreur } from "@/components/PageAutoEvaluation/MessageErreur";

export const InputNote = forwardRef<
  HTMLInputElement,
  ComponentProps<"input"> & { errorMessage?: string; label?: ReactNode }
>(function InputNote({ errorMessage, label, className, id, ...props }, ref) {
  return (
    <div className="flex flex-col text-center">
      {label ? (
        <label
          className={clsxm("font-bold text-sm mb-1 !italic", {
            "text-error": !!errorMessage,
          })}
          htmlFor={id}
        >
          {label}
        </label>
      ) : null}
      <input
        className={clsxm(
          "!block border !rounded-t w-[10ch] !px-4 !py-2",
          "!border-b-2 !border-b-gray-600",
          "text-center",
          "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className,
          {
            "!border-error text-error": !!errorMessage,
          },
        )}
        {...props}
        id={id}
        ref={ref}
        style={{
          appearance: "textfield",
          ...props.style,
        }}
        type="number"
      />
      <div className="relative h-3 mt-1">
        {errorMessage ? (
          <MessageErreur className="absolute right-0">
            {errorMessage}
          </MessageErreur>
        ) : null}
      </div>
    </div>
  );
});
