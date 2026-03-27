import { ComponentProps, forwardRef, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

type Props = ComponentProps<"button"> & {
  dataFrOpened?: boolean;
  iconLeft?: ReactNode;
};
export const BoutonSousLigné = forwardRef<HTMLButtonElement, Props>(
  function BoutonSousLigné(
    { className, dataFrOpened, iconLeft, children, ...props },
    ref,
  ) {
    return (
      <button
        className={clsxm(
          "!flex items-center gap-2 fr-link h-6 border-0 border-b border-solid border-current hover:enabled:bg-[unset] hover:enabled:border-b-2",
          className,
          {
            "!opacity-80": props.disabled,
          },
        )}
        data-fr-opened={dataFrOpened}
        {...props}
        ref={ref}
      >
        {iconLeft}
        {children}
      </button>
    );
  },
);
