import { ComponentProps, ComponentType, forwardRef } from "react";
import { Icone } from "@/components/_commons/Icone";
import { clsxm } from "@/utils/clsxm";

export const ActionReponse = forwardRef<
  HTMLButtonElement,
  {
    icone: ComponentType<{ className: string; fill: string }>;
    label: string;
  } & ComponentProps<"button">
>(function ActionReponse({ icone, label, className, ...props }, ref) {
  return (
    <button
      className={clsxm(
        "inline-flex h-7 items-center gap-1.5 px-2 text-xs font-medium text-dsfr-mention-grey transition-colors",
        "hover:bg-dsfr-grey-1000 hover:text-dsfr-grey-50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      type="button"
      {...props}
    >
      <Icone className="h-4 w-4 !text-current" icone={icone} />
      {label}
    </button>
  );
});
