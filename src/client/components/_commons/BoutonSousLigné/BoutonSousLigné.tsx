import { ComponentProps, forwardRef, ReactNode } from "react";
import clsx from "clsx";
import BoutonSousLignéStyled from "@/components/_commons/BoutonSousLigné/BoutonSousLigné.styled";

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
      <BoutonSousLignéStyled
        className={clsx(
          "!flex items-center gap-2 fr-link override",
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
      </BoutonSousLignéStyled>
    );
  },
);
